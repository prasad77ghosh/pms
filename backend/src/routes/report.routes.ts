import { Router } from "express";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { ReportController } from "../controllers/report.controller";

export default class ReportRoutes {
    public router: Router;
    private reportController: ReportController;
    public path = "reports";

    constructor() {
        this.router = Router();
        this.reportController = new ReportController();
        this.routes();
    }

    private routes() {
        this.router.post(
            "/request",
            new ProtectedMiddleware().protected,
            this.reportController.requestReport
        );

        this.router.get(
            "/status/:jobId",
            new ProtectedMiddleware().protected,
            this.reportController.getReportStatus
        );

        this.router.get(
            "/download/:jobId",
            new ProtectedMiddleware().protected,
            this.reportController.downloadReport
        );
    }
}
