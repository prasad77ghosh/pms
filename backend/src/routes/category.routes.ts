import { Router } from "express";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { CategoryController } from "../controllers/category.controller";
import { CategoryValidator } from "../validator/category.validator";

export default class CategoryRoutes {
  public router: Router;
  private categoryController: CategoryController;
  public path = "category";

  constructor() {
    this.router = Router();
    this.categoryController = new CategoryController();
    this.routes();
  }

  private routes() {
    // Create category (protected)
    this.router.post(
      "/add",
      new ProtectedMiddleware().protected,
      CategoryValidator.createValidation,
      this.categoryController.create
    );

    // List categories (public - no auth required)
    this.router.get(
      "/",
      CategoryValidator.listValidation,
      this.categoryController.list
    );

    // Get single category (public - no auth required)
    this.router.get(
      "/:id",
      CategoryValidator.getOneValidation,
      this.categoryController.getOne
    );

    // Update category (protected)
    this.router.put(
      "/:id",
      new ProtectedMiddleware().protected,
      CategoryValidator.updateValidation,
      this.categoryController.update
    );

    // Delete category (protected)
    this.router.delete(
      "/:id",
      new ProtectedMiddleware().protected,
      CategoryValidator.deleteValidation,
      this.categoryController.delete
    );
  }
}
