import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import AppError from "../errors/AppError.js";
import { config } from "../config/index.js";

const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorSources: { path: string; message: string }[] = [];

  // Zod validation error
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";

    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  // Generic JS Error
  else if (err instanceof Error) {
    message = err.message;

    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: config.node_env === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
