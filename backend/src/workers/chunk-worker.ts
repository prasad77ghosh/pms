import { parentPort } from "worker_threads";
import path from "path";
import { db } from "../db/databse";
import { BulkUploadService } from "../services/bulk-upload.service";
import { ReportService } from "../services/report.service";

interface WorkerJob {
  type?: "bulk_upload" | "generate_report";
  jobId: string;
  // Bulk Upload specific
  chunkIndex?: number;
  chunkFile?: string;
  createdBy?: string | null;
  persistence?: "db" | "redis" | "rmq";
  // Report specific
  reportType?: string;
  filters?: any;
}

interface WorkerResponse {
  jobId: string;
  // Bulk Upload specific
  chunkIndex?: number | undefined;
  chunkFile?: string | undefined;
  status: "completed" | "failed";
  errors?: Array<{ row: any; reason: string }> | undefined;
  error?: string | undefined;
  // Report specific
  type?: "bulk_upload" | "generate_report" | undefined;
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
  const { jobId, type = "bulk_upload" } = job;

  try {
    if (type === "generate_report") {
      console.log(`Worker Thread: Starting Report Generation jobId=${jobId}`);
      const reportService = new ReportService();
      await reportService.generateProductReport(jobId);

      const msg: WorkerResponse = {
        jobId,
        status: "completed",
        type: "generate_report"
      };
      parentPort?.postMessage(msg);
      return;
    }

    // Default to Bulk Upload
    const { chunkIndex, chunkFile, createdBy } = job;
    if (!chunkFile || chunkIndex === undefined) throw new Error("Invalid bulk upload job");

    console.log(
      `Worker Thread: Starting jobId=${jobId} chunk=${chunkIndex} file=${path.basename(
        chunkFile
      )}`
    );

    const service = new BulkUploadService({
      createdBy: createdBy ?? null,
      chunkFile,
    });

    const result = await service.processChunkFile(chunkFile, resolveCategoryId);

    const msg: WorkerResponse = {
      jobId,
      chunkIndex,
      status: "completed",
      chunkFile,
      errors: result.errors,
      type: "bulk_upload"
    };

    parentPort?.postMessage(msg);
  } catch (err: any) {
    console.error(`Worker error for job ${jobId}:`, err.message);

    const msg: WorkerResponse = {
      jobId,
      chunkIndex: job.chunkIndex,
      status: "failed",
      chunkFile: job.chunkFile,
      error: err.message,
      type: job.type
    };

    parentPort?.postMessage(msg);
  }
});
