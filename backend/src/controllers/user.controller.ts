import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { fieldValidateError } from "../helper";
import { AuthRequest } from "../types/auth";

export class UserController {
    /**
     * Get a single user by ID
     * GET /api/v1/user/:id
     */
    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            fieldValidateError(req);

            const { id }: any = req.params;

            const user = await UserService.getUser(id);

            res.status(200).json({
                success: true,
                msg: "User fetched successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * List all users with pagination and search
     * GET /api/v1/user
     */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, search, role } = req.query;
            fieldValidateError(req);

            const result = await UserService.listUsers({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search: (search as string) || "",
                role: (role as string) || "",
            });

            res.status(200).json({
                success: true,
                msg: "Users fetched successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a user
     * PUT /api/v1/user/:id
     */
    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            fieldValidateError(req);

            const { id }: any = req.params;
            const updates = req.body;

            const updatedUser = await UserService.updateUser(id, updates);

            res.status(200).json({
                success: true,
                msg: "User updated successfully",
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a user
     * DELETE /api/v1/user/:id
     */
    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            fieldValidateError(req);

            const { id }: any = req.params;

            await UserService.deleteUser(id);

            res.status(200).json({
                success: true,
                msg: "User deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}
