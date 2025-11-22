import { NextFunction, Response } from "express";
import { Unauthorized } from "http-errors";
import { JwtService } from "../utils/jwt.service";
import { AuthRequest } from "../types/auth";
import { db } from "../db/databse";

export default class ProtectedMiddleware extends JwtService {
  public protected = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.access_token;
      if (!token) throw new Unauthorized("Unauthorized");

      const payload: any = this.verifyAccessToken(token);
      if (!payload?.userId) throw new Unauthorized("Unauthorized");

      // ✅ Validate user in PostgreSQL instead of MongoDB
      const result = await db.query(
        "SELECT id FROM users WHERE id = $1 LIMIT 1",
        [payload.userId]
      );

      if (result.rows.length === 0) {
        throw new Unauthorized("Unauthorized");
      }

      req.payload = payload;
      next();
    } catch (error) {
      next(error);
    }
  };
}
