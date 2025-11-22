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
    // Create product (protected)
    this.router.post(
      "/add",
      new ProtectedMiddleware().protected,
      ProductValidator.createValidation,
      this.productController.create
    );

    // List products (public - no auth required)
    this.router.get(
      "/",
      new ProtectedMiddleware().protected,
      ProductValidator.listValidation,
      this.productController.list
    );

    // Get single product (public - no auth required)
    this.router.get(
      "/:id",
      new ProtectedMiddleware().protected,
      ProductValidator.getOneValidation,
      this.productController.getOne
    );

    // Update product (protected)
    this.router.put(
      "/:id",
      new ProtectedMiddleware().protected,
      ProductValidator.updateValidation,
      this.productController.update
    );

    // Delete product (protected)
    this.router.delete(
      "/:id",
      new ProtectedMiddleware().protected,
      ProductValidator.deleteValidation,
      this.productController.delete
    );
  }
}
