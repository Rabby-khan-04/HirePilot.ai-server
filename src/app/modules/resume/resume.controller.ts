import { Request, Response } from "express";
import status from "http-status";
import sendResponse from "../../utils/sendResponse.js";
import ResumeService from "./resume.service.js";
import AppError from "../../errors/AppError.js";
import { Types } from "mongoose";

const createResume = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const resume = await ResumeService.createResumeIntoDB(userId, req.body);

  return sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Resume uploaded and processed successfully",
    data: resume,
  });
};

const retryParsing = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const resumeId = req.params.resumeId as string;

  if (!resumeId) {
    throw new AppError(status.BAD_REQUEST, "Resume ID is required");
  }

  const userId = req.user._id as Types.ObjectId;
  const resume = await ResumeService.retryResumeParsing(resumeId, userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Resume parsing retried successfully",
    data: resume,
  });
};

const getAResume = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const resumeId = req.params.resumeId as string;
  const userId = req.user._id as Types.ObjectId;
  const resume = await ResumeService.getAResumeFromDB(resumeId, userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Resume fetched successfully",
    data: resume,
  });
};

const getAllResume = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const resume = await ResumeService.getAllResumeFromDB(userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Resume fetched successfully",
    data: resume,
  });
};

const ResumeController = {
  createResume,
  retryParsing,
  getAResume,
  getAllResume,
};

export default ResumeController;
