import { Request, Response, NextFunction } from "express";
import { fieldValidateError } from "../helper";
import { ProductService } from "../services/product.service";
import { AuthRequest } from "../types/auth";

export class ProductController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { name, price, category_id, image_url } = req.body;

      if (!req.payload?.userId) {
        return res.status(401).json({ success: false, msg: "Unauthorized" });
      }

      const product = await ProductService.createProduct({
        name,
        price,
        image_url,
        category_id,
        created_by: req.payload.userId,
      });

      res.status(201).json({
        success: true,
        msg: "Product created successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { id }: any = req.params;

      const product = await ProductService.getProduct(id);

      res.status(200).json({
        success: true,
        msg: "Product fetched successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, category, sort } = req.query;
      fieldValidateError(req);

      const result = await ProductService.listProducts({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search: (search as string) || "",
        category: (category as string) || "",
        sort: (sort as "price_asc" | "price_desc") || "price_asc",
      });

      res.status(200).json({
        success: true,
        msg: "Products fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { id }: any = req.params;
      const updates = req.body;

      const updatedProduct = await ProductService.updateProduct(id, updates);

      res.status(200).json({
        success: true,
        msg: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      fieldValidateError(req);

      const { id }: any = req.params;

      await ProductService.deleteProduct(id);

      res.status(200).json({
        success: true,
        msg: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
