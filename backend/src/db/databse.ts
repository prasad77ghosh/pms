import pkg from "pg";
import { db_url } from "../config";
import { isMainThread, threadId } from "worker_threads";

const { Pool } = pkg;

class PostgresDB {
  private static _instance: PostgresDB;
  private pool: pkg.Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: db_url,
      max: isMainThread ? 20 : 5,  // workers use smaller pools
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: false,
    });

    // Only the MAIN THREAD should run testConnection() + log
    if (isMainThread) {
      this.testConnection();
    }

    this.pool.on("error", (err) => {
      console.error(
        `Unexpected PostgreSQL Error (thread ${threadId}):`,
        err.message
      );
    });

    // Graceful shutdown only for main thread
    if (isMainThread) {
      process.on("SIGINT", () => this.shutdown("SIGINT"));
      process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    }
  }

  public static get instance(): PostgresDB {
    if (!this._instance) {
      this._instance = new PostgresDB();
    }
    return this._instance;
  }

  public query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  public getPool() {
    return this.pool;
  }

  private async testConnection() {
    try {
      await this.pool.query("SELECT NOW()");
      console.log("🔵 PostgreSQL Connected Successfully (main thread)");
    } catch (err: any) {
      console.error("❌ PostgreSQL Connection Failed:", err.message);
    }
  }

  private async shutdown(signal: string) {
    console.log(`🔌 Received ${signal}. Closing PostgreSQL pool...`);
    await this.pool.end();
    console.log("🟢 PostgreSQL pool closed.");
    process.exit(0);
  }
}

export const db = PostgresDB.instance;
