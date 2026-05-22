import { type ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.stack || err,
  });
};
