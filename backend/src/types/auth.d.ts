import { Request } from "express";

export interface AuthRequest extends Request {
  payload?: {
    userId: string;
    role: "user" | "admin";
    name: string;
  };
  location?: any;
}
