import { Router } from "express";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { ProductValidator } from "../validator/product.validtor";
import { BulkUploadController } from "../controllers/bulk-upload.controller";

export default class BulkUploadRoutes {
  public router: Router;
  private bulkUploadController: BulkUploadController;
  public path = "upload-product";

  constructor() {
    this.router = Router();
    this.bulkUploadController = new BulkUploadController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/upload",
      new ProtectedMiddleware().protected,
      this.bulkUploadController.upload
    );

    this.router.get(
      "/status/:jobId",
      new ProtectedMiddleware().protected,
      this.bulkUploadController.getJobStatus
    );
  }
}
