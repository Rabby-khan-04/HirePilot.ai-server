import status from "http-status";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../errors/AppError.js";
import jwt from "jsonwebtoken";
import User from "../modules/user/user.model.js";
import { config } from "../config/index.js";
import { NextFunction, Request, Response } from "express";

const verifyJwt = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token =
        req?.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      console.log(req.cookies);

      if (!token)
        throw new AppError(status.UNAUTHORIZED, "Unauthorized Access!!");

      const decoded = jwt.verify(token, config.access_token_secret);

      if (!decoded || typeof decoded === "string") {
        throw new AppError(status.UNAUTHORIZED, "Invalid token");
      }

      if (!decoded || !decoded._id)
        throw new AppError(status.UNAUTHORIZED, "Unauthorized Access");

      const user = await User.findById(decoded._id).select(
        "-createdAt -updatedAt -favorites",
      );

      if (!user) throw new AppError(status.UNAUTHORIZED, "Unauthorized Access");

      req.user = user;

      next();
    } catch (error: unknown) {
      //   console.err(`Token verification ERROR: ${error}`);

      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(status.UNAUTHORIZED, "Access token expired");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(status.UNAUTHORIZED, "Invalid token");
      }

      if (error instanceof AppError) throw error;

      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Something went wrong while verifing token!!",
      );
    }
  },
);

const AuthMiddleware = { verifyJwt };

export default AuthMiddleware;
