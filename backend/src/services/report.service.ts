import { db } from "../db/databse";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import { stringify } from "csv-stringify";

export class ReportService {
    private reportsDir = path.join(process.cwd(), "src", "temp", "reports");

    constructor() {
        fs.ensureDirSync(this.reportsDir);
    }

    async createReportJob(userId: string, type: string, filters: any): Promise<string> {
        const jobId = uuidv4();

        await db.query(
            `INSERT INTO reports (id, status, created_by, created_at) VALUES ($1, $2, $3, NOW())`,
            [jobId, "pending", userId]
        );

        return jobId;
    }

    async updateStatus(jobId: string, status: string, filePath?: string, error?: string) {
        let query = `UPDATE reports SET status = $2`;
        const params: any[] = [jobId, status];

        if (filePath) {
            query += `, file_path = $3`;
            params.push(filePath);
        }

        if (error) {
            query += `, error = $${params.length + 1}`;
            params.push(error);
        }

        if (status === 'completed' || status === 'failed') {
            query += `, completed_at = NOW()`;
        }

        query += ` WHERE id = $1`;

        await db.query(query, params);
    }

    async getReportStatus(jobId: string) {
        const res = await db.query(`SELECT * FROM reports WHERE id = $1`, [jobId]);
        return res.rows[0];
    }

    async markAsDownloaded(jobId: string) {
        await db.query(
            `UPDATE reports SET status = 'downloaded', file_path = NULL WHERE id = $1`,
            [jobId]
        );
    }

    async generateProductReport(jobId: string) {
        try {
            await this.updateStatus(jobId, "processing");

            const filePath = path.join(this.reportsDir, `products_${jobId}.csv`);
            const writableStream = fs.createWriteStream(filePath);

            // Only include columns that exist in the products table
            const columns = [
                "id",
                "name",
                "image_url",
                "price",
                "category_id",
                "created_at",
            ];

            const stringifier = stringify({ header: true, columns: columns });

            // Use streaming query to avoid loading all data into memory
            // This is critical for large datasets to prevent timeouts
            const client = await db.getPool().connect();

            try {
                // Only select non-deleted products
                const query = `SELECT id, name, image_url, price, category_id, created_at FROM products WHERE deleted_at IS NULL`;
                const stream = client.query(new (require('pg').Query)(query));

                // Pipe: DB Stream -> CSV Stringifier -> File Stream
                stringifier.pipe(writableStream);

                let rowCount = 0;
                stream.on('data', (row: any) => {
                    stringifier.write(row);
                    rowCount++;

                    // Log progress every 1000 rows
                    if (rowCount % 1000 === 0) {
                        console.log(`Report ${jobId}: Processed ${rowCount} rows`);
                    }
                });

                stream.on('end', () => {
                    console.log(`Report ${jobId}: Finished streaming ${rowCount} rows`);
                    stringifier.end();
                });

                stream.on('error', async (err: any) => {
                    console.error("Database stream error:", err);
                    client.release();
                    await this.updateStatus(jobId, "failed", undefined, err.message);
                });

                writableStream.on("finish", async () => {
                    console.log(`Report ${jobId}: File written successfully`);
                    client.release();
                    await this.updateStatus(jobId, "completed", filePath);
                });

                writableStream.on("error", async (err: any) => {
                    console.error("File write error:", err);
                    client.release();
                    await this.updateStatus(jobId, "failed", undefined, err.message);
                });

            } catch (err: any) {
                client.release();
                throw err;
            }

        } catch (error: any) {
            console.error("Report generation error:", error);
            await this.updateStatus(jobId, "failed", undefined, error.message);
        }
    }
}
