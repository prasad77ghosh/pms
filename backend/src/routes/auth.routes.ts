import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthControllerValidator } from "../validator/auth.validator";
import ProtectedMiddleware from "../middlewares/protected.middleware";

export default class AuthRoutes {
  public router: Router;
  private authController: AuthController;
  public path = "auth";

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/register",
      AuthControllerValidator.registerValidation,
      this.authController.register
    );

    this.router.post(
      "/login",
      AuthControllerValidator.loginValidation,
      this.authController.login
    );

    this.router.post(
      "/refresh",
      AuthControllerValidator.refreshValidation,
      this.authController.refreshToken
    );

    this.router.post(
      "/logout",
      new ProtectedMiddleware().protected,
      AuthControllerValidator.logoutValidation,
      this.authController.logout
    );

    this.router.get(
      "/profile",
      new ProtectedMiddleware().protected,
      this.authController.getProfile
    );
  }
}
