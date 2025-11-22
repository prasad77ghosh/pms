import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { ProductValidator } from "../validator/product.validtor";

export default class ProductRoutes {
  public router: Router;
  private productController: ProductController;
  public path = "product";

  constructor() {
    this.router = Router();
    this.productController = new ProductController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/add",
      new ProtectedMiddleware().protected,
      ProductValidator.createValidation,
      this.productController.create
    );
  }
}
