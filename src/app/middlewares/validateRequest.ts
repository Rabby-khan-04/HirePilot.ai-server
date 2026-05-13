import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import { ZodType } from "zod";

export const validateRequest = (schema: ZodType) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync(req.body);
    next();
  });
};
