// src/services/BulkUploadService.ts

import fs from "fs";
import csvParser from "csv-parser";
import { db } from "../db/databse";

export interface RawProductRow {
  name: string;
  price: string | number;
  category?: string;
  categoryName?: string;
  image_url?: string;
  imageUrl?: string;
}

export interface ProductRow {
  name: string;
  price: number;
  category_id: string;
  image_url?: string | null;
  created_by: string | null;
}

export interface ProcessResult {
  errors: Array<{
    row: any;
    reason: string;
  }>;
}

export class BulkUploadService {
  private CHUNK_BATCH = 500;
  private createdBy: string | null;
  private chunkFile: string;

  constructor({
    createdBy,
    chunkFile,
  }: {
    createdBy: string | null;
    chunkFile: string;
  }) {
    this.createdBy = createdBy ?? null;
    this.chunkFile = chunkFile;
  }

  private async transformRow(
    raw: RawProductRow
  ): Promise<Omit<ProductRow, "category_id"> & { categoryName: string }> {
    const name = raw.name;
    const price = parseFloat(raw.price as any);
    const categoryName = raw.category || raw.categoryName || "";
    const image_url = raw.image_url || raw.imageUrl || null;

    if (!name || Number.isNaN(price)) {
      throw new Error("validation_failed");
    }

    return {
      name,
      price,
      categoryName,
      image_url,
      created_by: this.createdBy,
    };
  }

  private async insertBatch(rows: ProductRow[]): Promise<void> {
    if (!rows.length) return;

    const cols = ["name", "price", "category_id", "image_url", "created_by"];
    const values: any[] = [];

    const placeholders = rows
      .map((r, i) => {
        const base = i * cols.length;
        values.push(
          r.name,
          r.price,
          r.category_id,
          r.image_url ?? null,
          r.created_by
        );
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`;
      })
      .join(",");

    const query = `INSERT INTO products (${cols.join(",")}) VALUES ${placeholders}`;
    await db.query(query, values);
  }

  async processChunkFile(
    chunkFile: string,
    resolveCategoryId: (categoryName: string) => Promise<string>
  ): Promise<ProcessResult> {
    const errors: ProcessResult["errors"] = [];
    const rowsBuffer: ProductRow[] = [];

    const flushBatch = async () => {
      if (!rowsBuffer.length) return;
      try {
        const batch = rowsBuffer.splice(0);
        await this.insertBatch(batch);
      } catch (err) {
        const failed = rowsBuffer.splice(0);
        for (const row of failed) {
          try {
            await this.insertBatch([row]);
          } catch (e: any) {
            errors.push({ row, reason: e.message });
          }
        }
      }
    };

    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(chunkFile).pipe(csvParser());
      const queue: RawProductRow[] = [];
      let processing = false;
      let ended = false;

      const processNext = async () => {
        if (processing) return;
        if (queue.length === 0) {
          if (ended) {
            await flushBatch();
            return resolve();
          }
          return;
        }

        processing = true;
        const raw = queue.shift()!;

        // Skip header correctly
        if (raw.name === "name" && raw.price === "price") {
          processing = false;
          return processNext();
        }

        try {
          const transformed = await this.transformRow(raw);
          const category_id = await resolveCategoryId(
            transformed.categoryName
          );

          rowsBuffer.push({
            name: transformed.name,
            price: transformed.price,
            category_id,
            created_by: transformed.created_by,
            image_url: transformed.image_url ?? null,
          });

          if (rowsBuffer.length >= this.CHUNK_BATCH) {
            await flushBatch();
          }
        } catch (err: any) {
          errors.push({ row: raw, reason: err.message });
        }

        processing = false;
        processNext();
      };

      stream.on("data", (raw) => {
        queue.push(raw);
        processNext();
      });

      stream.on("end", () => {
        ended = true;
        processNext();
      });

      stream.on("error", (err) => reject(err));
    });

    return { errors };
  }
}
