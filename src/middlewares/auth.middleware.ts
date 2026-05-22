import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";

export const auth = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) throw new Error("No token provided");

      const decoded = jwt.verify(token, config.jwt_secret as string) as any;
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        throw Object.assign(new Error("Forbidden Access"), {
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(
        Object.assign(new Error("Unauthorized access"), {
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    }
  };
};
