import { Request, Response } from "express";
import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import sendResponse from "../../utils/sendResponse.js";
import JobProfileService from "./jobProfile.service.js";

const createJobProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const jobProfile = await JobProfileService.createJobProfileIntoDB(
    userId,
    req.body,
  );

  return sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Job profile created successfully",
    data: jobProfile,
  });
};

const getAllJobProfiles = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const jobProfiles = await JobProfileService.getAllJobProfilesFromDB(userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Job profiles retrieved successfully",
    data: jobProfiles,
  });
};

const getSingleJobProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const userId = req.user._id as Types.ObjectId;
  const id = req.params.id as string;

  const jobProfile = await JobProfileService.getSingleJobProfileFromDB(
    id,
    userId,
  );

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Job profile retrieved successfully",
    data: jobProfile,
  });
};

const getJobAnalysis = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(status.UNAUTHORIZED, "Unauthorized access");

  const userId = req.user._id as Types.ObjectId;
  const analysis = await JobProfileService.getJobAnalysisFromDB(userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Job analysis retrieved successfully",
    data: analysis,
  });
};

const JobProfileController = {
  createJobProfile,
  getAllJobProfiles,
  getSingleJobProfile,
  getJobAnalysis,
};

export default JobProfileController;
