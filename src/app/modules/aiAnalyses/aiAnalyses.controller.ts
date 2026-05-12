import { Request, Response } from "express";
import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import sendResponse from "../../utils/sendResponse.js";
import AiAnalysesService from "./aiAnalyses.service.js";
import { AnalysesQueryOptions } from "./aiAnalyses.interface.js";

const generateAnalysis = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const { resumeId, jobProfileId } = req.body as {
    resumeId: string;
    jobProfileId: string;
  };

  const analysis = await AiAnalysesService.generateAndSaveAnalysis(
    userId,
    resumeId,
    jobProfileId,
  );

  return sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "AI analysis generated successfully",
    data: analysis,
  });
};

const getUserAnalyses = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;

  const {
    search = "",
    scoreFilter = "all",
    sortBy = "mostRecent",
    page = "1",
    limit = "10",
  } = req.query as Record<string, string>;

  const analyses = await AiAnalysesService.getUserAnalyses(userId, {
    search,
    scoreFilter:
      (scoreFilter as NonNullable<AnalysesQueryOptions["scoreFilter"]>) ??
      "all",
    sortBy:
      (sortBy as NonNullable<AnalysesQueryOptions["sortBy"]>) ?? "mostRecent",
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(50, Math.max(1, parseInt(limit, 10) || 10)),
  });

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Analyses retrieved successfully",
    data: analyses,
  });
};

const getSingleAnalysis = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const analysisId = req.params.id;

  if (!analysisId || Array.isArray(analysisId)) {
    throw new AppError(status.BAD_REQUEST, "Invalid analysis ID");
  }

  const analysis = await AiAnalysesService.getSingleAnalysis(
    analysisId,
    userId,
  );

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Analysis retrieved successfully",
    data: analysis,
  });
};

const AiAnalysesController = {
  generateAnalysis,
  getUserAnalyses,
  getSingleAnalysis,
};

export default AiAnalysesController;
