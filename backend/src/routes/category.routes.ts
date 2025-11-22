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
    this.router.post(
      "/add",
      new ProtectedMiddleware().protected,
      CategoryValidator.createValidation,
      this.categoryController.create
    );
  }
}
