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
    } else {
      await ChunkManager.markFailed(jobId, chunkIndex, [
        { reason: error || "unknown error" },
      ]);
    }

    if (chunkFile) {
      try {
        await fs.remove(chunkFile);
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

      let linesPerChunk = parseInt(req.body.linesPerChunk || "10000", 10);

      // Count lines, but stop if we exceed linesPerChunk (since we only care if it's smaller)
      // Actually, we need to know if total < linesPerChunk.
      // So if we count up to linesPerChunk + 1, we know it's larger.
      const totalLines = await countLines(savedPath, linesPerChunk + 1);
      const totalRecords = Math.max(1, totalLines - 1); // Ensure at least 1

      // Cap linesPerChunk at totalRecords if totalRecords is smaller
      if (linesPerChunk > totalRecords) {
        linesPerChunk = totalRecords;
      }

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
      next(error);
    }
  }
}

async function countLines(filePath: string, limit?: number): Promise<number> {
  return new Promise((resolve, reject) => {
    let lines = 0;
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk: any) => {
      for (let i = 0; i < chunk.length; ++i) {
        if (chunk[i] === 10) lines++; // 10 is '\n'
      }
      if (limit && lines > limit) {
        stream.destroy();
        resolve(lines);
      }
    });

    stream.on("end", () => {
      resolve(lines);
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}
