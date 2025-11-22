// src/workers/worker-pool.instance.ts

import path from "path";
import { WorkerPool } from "./worker-pool";

const workerFile =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "chunk-worker.js")
    : path.join(process.cwd(), "src", "workers", "chunk-worker.ts");

export const workerPool = new WorkerPool(workerFile);
