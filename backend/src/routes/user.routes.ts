import { Router } from "express";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { UserController } from "../controllers/user.controller";
import { UserValidator } from "../validator/user.validator";

export default class UserRoutes {
    public router: Router;
    private userController: UserController;
    public path = "user";

    constructor() {
        this.router = Router();
        this.userController = new UserController();
        this.routes();
    }

    private routes() {
        // List users (protected - admin only recommended)
        this.router.get(
            "/",
            new ProtectedMiddleware().protected,
            UserValidator.listValidation,
            this.userController.list
        );

        // Get single user (protected)
        this.router.get(
            "/:id",
            new ProtectedMiddleware().protected,
            UserValidator.getOneValidation,
            this.userController.getOne
        );

        // Update user (protected)
        this.router.put(
            "/:id",
            new ProtectedMiddleware().protected,
            UserValidator.updateValidation,
            this.userController.update
        );

        // Delete user (protected - admin only recommended)
        this.router.delete(
            "/:id",
            new ProtectedMiddleware().protected,
            UserValidator.deleteValidation,
            this.userController.delete
        );
    }
}
