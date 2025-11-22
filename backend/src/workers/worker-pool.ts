import os from "os";
import path from "path";
import { Worker } from "worker_threads";

export interface WorkerJob {
  [key: string]: any;
}

export type WorkerMessage = any;

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: WorkerJob[] = [];
  private active: Set<Worker> = new Set();

  constructor(private workerFile: string) {
    this.init();
  }

  private init() {
    const cpu = os.cpus().length;
    const total = Math.max(1, Math.floor(cpu * 0.6));

    for (let i = 0; i < total; i++) {
      this.spawn();
    }
  }

  /**
   * Spawn worker with correct dev/prod TypeScript handling
   */
  private spawn() {
    const workerPath = this.resolveWorkerPath();

    const worker = new Worker(workerPath, {
      execArgv:
        process.env.NODE_ENV === "production"
          ? [] // production = use compiled JS
          : ["-r", "ts-node/register"], // dev = load TypeScript worker
    });

    worker.on("message", (msg: WorkerMessage) => {
      this.active.delete(worker);

      if (this.onWorkerResult) {
        this.onWorkerResult(msg);
      }

      if (this.queue.length > 0) {
        const job = this.queue.shift()!;
        this.runJob(worker, job);
      }
    });

    worker.on("error", (err) => {
      console.error("Worker error:", err);
      this.active.delete(worker);
      this.spawn();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}. Respawning...`);
        this.active.delete(worker);
        this.spawn();
      }
    });

    this.workers.push(worker);
  }

  /**
   * Resolve correct worker path for dev (.ts) and prod (.js)
   */
  private resolveWorkerPath() {
    if (process.env.NODE_ENV === "production") {
      return path.join(__dirname, "..", "workers", "chunk-worker.js");
    }

    // Development: use TypeScript file in /src
    return path.join(process.cwd(), "src", "workers", "chunk-worker.ts");
  }

  private runJob(worker: Worker, job: WorkerJob) {
    this.active.add(worker);
    worker.postMessage(job);
  }

  public addJob(job: WorkerJob) {

    const freeWorker = this.workers.find((w) => !this.active.has(w));

    if (freeWorker) {
      this.runJob(freeWorker, job);
    } else {
      this.queue.push(job);
    }
  }

  public onWorkerResult?: (msg: WorkerMessage) => void;
}
