import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/auth";
import { ReportService } from "../services/report.service";
import { workerPool } from "../workers/workerpool";
import fs from "fs-extra";

export class ReportController {
    private reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    requestReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.payload?.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const { type = "products", filters = {} } = req.body;

            const jobId = await this.reportService.createReportJob(userId, type, filters);

            // Offload to worker
            workerPool.addJob({
                type: "generate_report",
                jobId,
                reportType: type,
                filters
            });

            return res.status(202).json({
                message: "Report generation started",
                jobId
            });
        } catch (error) {
            next(error);
        }
    };

    getReportStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { jobId } = req.params;
            if (!jobId) return res.status(400).json({ message: "jobId required" });

            const report = await this.reportService.getReportStatus(jobId);

            if (!report) return res.status(404).json({ message: "Report not found" });

            return res.json(report);
        } catch (error) {
            next(error);
        }
    };

    downloadReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { jobId } = req.params;
            if (!jobId) return res.status(400).json({ message: "jobId required" });

            const report = await this.reportService.getReportStatus(jobId);

            if (!report) return res.status(404).json({ message: "Report not found" });
            if (report.status !== "completed") return res.status(400).json({ message: "Report not ready" });
            if (!report.file_path || !fs.existsSync(report.file_path)) {
                return res.status(500).json({ message: "File not found on server" });
            }

            const filePath = report.file_path;

            // Send file to user
            res.download(filePath, async (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                    return;
                }

                // Delete file after successful download
                try {
                    await fs.remove(filePath);
                    console.log(`🗑️ Deleted report file: ${filePath}`);

                    // Optional: Update database to mark as downloaded/deleted
                    await this.reportService.markAsDownloaded(jobId);
                } catch (deleteErr) {
                    console.error("Error deleting report file:", deleteErr);
                }
            });
        } catch (error) {
            next(error);
        }
    };
}
