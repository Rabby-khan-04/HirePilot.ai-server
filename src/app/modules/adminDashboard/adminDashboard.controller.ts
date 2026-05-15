import { Request, Response } from "express";
import status from "http-status";
import { AdminDashboardService } from "./adminDashboard.service.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

// ── Overview ───────────────────────────────────────────────────────────────

const getOverviewStats = catchAsync(async (_req: Request, res: Response) => {
  const data = await AdminDashboardService.getOverviewStats();

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin overview stats fetched successfully",
    data,
  });
});

// ── Chart Data ─────────────────────────────────────────────────────────────

const getPeriod = (req: Request): "week" | "month" => {
  const period = req.query.period as string;
  if (period !== "week" && period !== "month") return "month"; // default
  return period;
};

const getUserChartData = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminDashboardService.getUserChartData(getPeriod(req));

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User chart data fetched successfully",
    data,
  });
});

const getResumeChartData = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminDashboardService.getResumeChartData(getPeriod(req));

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Resume chart data fetched successfully",
    data,
  });
});

const getAnalysisChartData = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminDashboardService.getAnalysisChartData(getPeriod(req));

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Analysis chart data fetched successfully",
    data,
  });
});

const getRoadmapChartData = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminDashboardService.getRoadmapChartData(getPeriod(req));

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Roadmap chart data fetched successfully",
    data,
  });
});

// ── Recent Activity ────────────────────────────────────────────────────────

const getRecentActivity = catchAsync(async (_req: Request, res: Response) => {
  const data = await AdminDashboardService.getRecentActivity();

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Recent activity fetched successfully",
    data,
  });
});

// ── Platform Intelligence ──────────────────────────────────────────────────

const getPlatformIntelligence = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await AdminDashboardService.getPlatformIntelligence();

    return sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Platform intelligence fetched successfully",
      data,
    });
  },
);

export const AdminDashboardController = {
  getOverviewStats,
  getUserChartData,
  getResumeChartData,
  getAnalysisChartData,
  getRoadmapChartData,
  getRecentActivity,
  getPlatformIntelligence,
};
