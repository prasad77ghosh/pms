import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/auth";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs-extra";
import { splitCSV } from "../utils/splitter";
import { ChunkManager } from "../utils/chunk-manager";
import { publishChunks } from "../utils/rmq-chunk-manager";
import { workerPool } from "../workers/workerpool";
import { persistance } from "../config";

workerPool.onWorkerResult = async (msg) => {
  try {
    const { jobId, chunkIndex, status, errors, error, chunkFile } = msg;

    if (status === "completed") {
      await ChunkManager.markCompleted(jobId, chunkIndex, errors || []);
      console.log(`Chunk ${chunkIndex} completed`);
    } else {
      await ChunkManager.markFailed(jobId, chunkIndex, [
        { reason: error || "unknown error" },
      ]);
      console.log(`Chunk ${chunkIndex} failed`);
    }

    if (chunkFile) {
      try {
        await fs.remove(chunkFile);
        console.log("🧹 Deleted chunk file:", chunkFile);
      } catch (err) {
        console.error("Failed to delete chunk file:", chunkFile, err);
      }
    }
  } catch (err) {
    console.error("Failed to update chunk status:", err);
  }
};

export class BulkUploadController {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.files?.file)
        return res.status(400).json({ message: "file required" });

      const file = req.files.file as any;
      const jobId = uuidv4();

      const uploadsDir = path.join(process.cwd(), "src", "temp", "uploads");
      await fs.ensureDir(uploadsDir);

      const savedPath = path.join(uploadsDir, `${jobId}_${file.name}`);
      await file.mv(savedPath);

      // Count total lines in CSV (excluding header)
      const totalLines = await this.countCSVLines(savedPath);
      console.log(`📊 CSV contains ${totalLines} data rows`);

      // Dynamic chunk size calculation
      let linesPerChunk: number;
      if (req.body.linesPerChunk) {
        // User specified chunk size
        linesPerChunk = parseInt(req.body.linesPerChunk, 10);
      } else {
        // Auto-calculate based on file size
        if (totalLines <= 5000) {
          // Small file: process as single chunk
          linesPerChunk = totalLines;
          console.log(`✅ Small file detected, processing as single chunk`);
        } else if (totalLines <= 50000) {
          // Medium file: 10k per chunk
          linesPerChunk = 10000;
        } else {
          // Large file: 20k per chunk
          linesPerChunk = 20000;
        }
      }

      console.log(`🔢 Using chunk size: ${linesPerChunk} lines`);
      const chunks = await splitCSV(savedPath, linesPerChunk);

      const persistence = req.body.persistence || persistance;

      if (persistence === "db") {
        const myJobId = await ChunkManager.createJob({
          fileName: file.name,
          totalChunks: chunks.length,
          createdBy: req.payload?.userId ?? null,
        });

        await ChunkManager.createChunkRecords(myJobId, chunks);

        const pending = await ChunkManager.listPendingChunks(myJobId);

        for (const ch of pending) {
          workerPool.addJob({
            jobId: myJobId,
            chunkIndex: ch.chunk_index,
            chunkFile: ch.chunk_file,
            createdBy: req.payload?.userId ?? null,
            persistence: "db",
          });
        }

        return res.status(202).json({
          jobId: myJobId,
          chunks: chunks.length,
          persistence: "db",
        });
      }

      const createdBy = req.payload?.userId as any;

      if (persistence === "rmq") {
        await publishChunks(jobId, chunks, createdBy);
        return res.status(202).json({
          jobId,
          chunks: chunks.length,
          persistence: "rmq",
        });
      }

      return res.status(400).json({ message: "invalid persistence option" });
    } catch (error) {
      console.log("ERROR--CONTROLLER-->", error);
      next(error);
    }
  }

  async getJobStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      if (!jobId) return res.status(400).json({ message: "jobId required" });

      const status = await ChunkManager.getJobStatus(jobId);
      if (!status) return res.status(404).json({ message: "job not found" });

      return res.json(status);
    } catch (error) {
      console.log("ERROR--STATUS-->", error);
      next(error);
    }
  }

  private async countCSVLines(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let lineCount = 0;
      const stream = fs.createReadStream(filePath);
      const rl = require('readline').createInterface({
        input: stream,
        crlfDelay: Infinity
      });

      rl.on('line', () => {
        lineCount++;
      });

      rl.on('close', () => {
        // Subtract 1 for header row
        resolve(Math.max(0, lineCount - 1));
      });

      rl.on('error', reject);
    });
  }
}
