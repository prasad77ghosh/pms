import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";
import { fieldValidateError } from "../helper";
import { AuthRequest } from "../types/auth";

export class CategoryController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { name } = req.body;

      const category = await CategoryService.createCategory({
        name,
      });

      res.status(201).json({
        success: true,
        msg: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { page, limit, search } = req.query;

      const result = await CategoryService.listCategories({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search: (search as string) || "",
      });

      res.status(200).json({
        success: true,
        msg: "Categories fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { id }:any = req.params;

      const category = await CategoryService.getCategory(id);

      res.status(200).json({
        success: true,
        msg: "Category fetched successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { id }:any = req.params;
      const updates = req.body;

      const category = await CategoryService.updateCategory(id, updates);

      res.status(200).json({
        success: true,
        msg: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE --------------------------------------------------
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);
      const { id }:any = req.params;

      await CategoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        msg: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
