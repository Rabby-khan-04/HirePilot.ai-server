// dashboardStats.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import { Types } from "mongoose";
import { DashboardStatsService } from "./dashboardStats.service.js";
import AppError from "../../errors/AppError.js";
import sendResponse from "../../utils/sendResponse.js";

const getUsersDashboardStats = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const stats = await DashboardStatsService.getUsersDashboardStats(
    req.user._id as Types.ObjectId,
  );

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: stats,
  });
};

export const DashboardStatsController = { getUsersDashboardStats };
