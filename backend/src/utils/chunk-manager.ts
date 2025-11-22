// src/jobs/manager_db.ts
import path from "path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/databse"; // keep your existing db client

// -----------------------------
// TYPES
// -----------------------------

export interface CreateJobParams {
  fileName: string;
  totalChunks: number;
  createdBy?: string | null;
}

export interface ChunkRecord {
  id: string,
  chunk_index: number;
  chunk_file: string;
}

export interface JobStatus {
  status: string;
  completed: number;
  total: number;
}

// -----------------------------
// DB MANAGER
// -----------------------------

export const ChunkManager = {

  async createJob({ fileName, totalChunks, createdBy }: CreateJobParams): Promise<string> {
    const jobId = uuidv4();

    await db.query(
      `
      INSERT INTO bulk_jobs (job_id, file_name, total_chunks, status, created_by)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [jobId, fileName, totalChunks, "pending", createdBy ?? null]
    );

    return jobId;
  },


  async createChunkRecords(jobId: string, chunkFiles: string[]): Promise<void> {
    if (!chunkFiles.length) return;

    // Build dynamic SQL string for multiple chunk inserts
    const valuesSql = chunkFiles
      .map((_, i) => `($1, ${i + 1}, $${i + 2}, 'pending')`)
      .join(",");

    const params = [jobId, ...chunkFiles];

    await db.query(
      `
      INSERT INTO bulk_job_chunks (job_id, chunk_index, chunk_file, status)
      VALUES ${valuesSql}
      `,
      params
    );
  },


  async markProcessing(jobId: string, chunkIndex: number): Promise<void> {
    await db.query(
      `
      UPDATE bulk_job_chunks 
      SET status='processing', attempts = attempts + 1, updated_at = now()
      WHERE job_id=$1 AND chunk_index=$2
      `,
      [jobId, chunkIndex]
    );
  },


  async markCompleted(jobId: string, chunkIndex: number, errors: any[] = []): Promise<void> {
    await db.query(
      `
      UPDATE bulk_job_chunks 
      SET status='completed', errors=$3::jsonb, updated_at = now()
      WHERE job_id=$1 AND chunk_index=$2
      `,
      [jobId, chunkIndex, JSON.stringify(errors)]
    );
  },


  async markFailed(jobId: string, chunkIndex: number, errors: any[] = []): Promise<void> {
    await db.query(
      `
      UPDATE bulk_job_chunks 
      SET status='failed', errors=$3::jsonb, updated_at = now()
      WHERE job_id=$1 AND chunk_index=$2
      `,
      [jobId, chunkIndex, JSON.stringify(errors)]
    );
  },


  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const res = await db.query(
      `
      SELECT 
        status,
        (SELECT COUNT(*)::int FROM bulk_job_chunks WHERE job_id=$1 AND status='completed') AS completed,
        (SELECT COUNT(*)::int FROM bulk_job_chunks WHERE job_id=$1) AS total
      FROM bulk_jobs
      WHERE job_id=$1
      `,
      [jobId]
    );

    if (!res.rows.length) return null;

    return res.rows[0] as JobStatus;
  },

  async listPendingChunks(jobId: string): Promise<ChunkRecord[]> {
    const r = await db.query(
      `
      SELECT id,chunk_index, chunk_file
      FROM bulk_job_chunks
      WHERE job_id=$1 
        AND status IN ('pending', 'failed')
      ORDER BY chunk_index
      `,
      [jobId]
    );

    return r.rows as ChunkRecord[];
  }
};
