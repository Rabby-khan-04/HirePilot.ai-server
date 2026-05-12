import { Request, Response } from "express";
import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import sendResponse from "../../utils/sendResponse.js";
import LearningRoadmapService from "./learningRoadmap.service.js";
import { RoadmapQueryOptions } from "./learningRoadmap.interface.js";

// ─── Generate Roadmap ──────────────────────────────────────────────────────────

const generateRoadmap = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const { analysisId } = req.body as { analysisId: string };

  const roadmap = await LearningRoadmapService.generateAndSaveRoadmap(
    userId,
    analysisId,
  );

  return sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Learning roadmap generated successfully",
    data: roadmap,
  });
};

// ─── Get All User Roadmaps ─────────────────────────────────────────────────────

const getUserRoadmaps = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;

  // --- query params ---
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  const rawStatus = req.query.status as string | undefined;
  const statusFilter: RoadmapQueryOptions["statusFilter"] =
    rawStatus === "completed" ||
    rawStatus === "in-progress" ||
    rawStatus === "not-started"
      ? rawStatus
      : "all";

  const durationFilter =
    typeof req.query.duration === "string" ? req.query.duration.trim() : "all";

  const rawSort = req.query.sortBy as string | undefined;
  const sortBy: RoadmapQueryOptions["sortBy"] =
    rawSort === "progress" || rawSort === "title" ? rawSort : "updatedAt";

  const queryOptions: RoadmapQueryOptions = {
    search,
    statusFilter,
    durationFilter,
    sortBy,
  };

  const roadmaps = await LearningRoadmapService.getUserRoadmaps(
    userId,
    queryOptions,
  );

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Roadmaps retrieved successfully",
    data: roadmaps,
  });
};

// ─── Get Single Roadmap ────────────────────────────────────────────────────────

const getSingleRoadmap = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const { roadmapId } = req.params;

  if (!roadmapId || Array.isArray(roadmapId)) {
    throw new AppError(status.BAD_REQUEST, "Invalid roadmap ID");
  }

  const roadmap = await LearningRoadmapService.getSingleRoadmap(
    roadmapId,
    userId,
  );

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Roadmap retrieved successfully",
    data: roadmap,
  });
};

// ─── Toggle Task Completion ────────────────────────────────────────────────────

const toggleTaskCompletion = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const { roadmapId, taskId } = req.params;

  if (
    !roadmapId ||
    Array.isArray(roadmapId) ||
    !taskId ||
    Array.isArray(taskId)
  ) {
    throw new AppError(status.BAD_REQUEST, "Invalid roadmap ID or task ID");
  }

  const roadmap = await LearningRoadmapService.toggleTaskCompletion(
    roadmapId,
    taskId,
    userId,
  );

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Task completion toggled successfully",
    data: roadmap,
  });
};

// ─── Delete Roadmap ────────────────────────────────────────────────────────────

const deleteRoadmap = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const { roadmapId } = req.params;

  if (!roadmapId || Array.isArray(roadmapId)) {
    throw new AppError(status.BAD_REQUEST, "Invalid roadmap ID");
  }

  await LearningRoadmapService.deleteRoadmap(roadmapId, userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Roadmap deleted successfully",
    data: null,
  });
};

const LearningRoadmapController = {
  generateRoadmap,
  getUserRoadmaps,
  getSingleRoadmap,
  toggleTaskCompletion,
  deleteRoadmap,
};

export default LearningRoadmapController;
