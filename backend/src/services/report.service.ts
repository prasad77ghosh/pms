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

            // CSV columns with category name instead of ID
            const columns = [
                "id",
                "name",
                "image_url",
                "price",
                "category_name",
                "created_at",
            ];

            const stringifier = stringify({ header: true, columns: columns });

            // Use batch processing to avoid loading all data into memory
            const client = await db.getPool().connect();

            try {
                const batchSize = 10000;
                let offset = 0;
                let hasMore = true;

                // Pipe stringifier to file
                stringifier.pipe(writableStream);

                let totalRows = 0;

                while (hasMore) {
                    // JOIN with categories to get category name
                    // Format created_at as DD/MM/YYYY HH24:MI:SS to prevent Excel scientific notation
                    const query = `
                        SELECT 
                            p.id, 
                            p.name, 
                            p.image_url, 
                            p.price, 
                            c.name as category_name,
                            TO_CHAR(p.created_at, 'DD/MM/YYYY HH24:MI:SS') as created_at
                        FROM products p
                        LEFT JOIN categories c ON p.category_id = c.id
                        WHERE p.deleted_at IS NULL 
                        ORDER BY p.created_at 
                        LIMIT $1 OFFSET $2
                    `;

                    const result = await client.query(query, [batchSize, offset]);

                    if (result.rows.length === 0) {
                        hasMore = false;
                        break;
                    }

                    // Write batch to CSV
                    for (const row of result.rows) {
                        stringifier.write(row);
                        totalRows++;
                    }

                    console.log(`Report ${jobId}: Processed ${totalRows} rows`);

                    offset += batchSize;
                    hasMore = result.rows.length === batchSize;
                }

                // Close the stringifier
                stringifier.end();

                // Wait for file write to complete
                await new Promise<void>((resolve, reject) => {
                    writableStream.on('finish', () => {
                        console.log(`Report ${jobId}: File written successfully with ${totalRows} rows`);
                        resolve();
                    });
                    writableStream.on('error', reject);
                });

                client.release();
                await this.updateStatus(jobId, "completed", filePath);

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
