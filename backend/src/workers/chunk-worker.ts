// src/workers/chunkWorker.ts

import { parentPort } from "worker_threads";
import path from "path";
import { db } from "../db/databse";
import { BulkUploadService } from "../services/bulk-upload.service";

interface WorkerJob {
  jobId: string;
  chunkIndex: number;
  chunkFile: string;
  createdBy: string | null;
  persistence?: "db" | "redis" | "rmq";
}

interface WorkerResponse {
  jobId: string;
  chunkIndex: number;
  chunkFile: string;
  status: "completed" | "failed";
  errors?: Array<{ row: any; reason: string }>;
  error?: string;
}

async function resolveCategoryId(categoryName: string): Promise<string> {
  try {
    const find = await db.query(
      `SELECT id FROM categories WHERE name=$1 LIMIT 1`,
      [categoryName]
    );

    if (find.rows.length) return find.rows[0].id;

    const insert = await db.query(
      `
      INSERT INTO categories (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
      [categoryName]
    );

    return insert.rows[0].id;
  } catch (err: any) {
    console.log("ERROR--WORKER-->", err);

    console.error("Category resolve error:", err.message);
    throw new Error("category_resolve_failed");
  }
}

parentPort?.on("message", async (job: WorkerJob) => {
  const { jobId, chunkIndex, chunkFile, createdBy } = job;
  try {
    console.log(
      `Worker Thread: Starting jobId=${jobId} chunk=${chunkIndex} file=${path.basename(
        chunkFile
      )}`
    );

    const service = new BulkUploadService({
      createdBy,
      chunkFile,
    });

    const result = await service.processChunkFile(chunkFile, resolveCategoryId);

    const msg: WorkerResponse = {
      jobId,
      chunkIndex,
      status: "completed",
      chunkFile,
      errors: result.errors,
    };

    parentPort?.postMessage(msg);
  } catch (err: any) {
    console.error(`Worker error in chunk ${chunkIndex}:`, err.message);

    const msg: WorkerResponse = {
      jobId,
      chunkIndex,
      status: "failed",
      chunkFile,
      error: err.message,
    };

    parentPort?.postMessage(msg);
  }
});
