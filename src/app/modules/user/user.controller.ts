import { Request, Response } from "express";
import status from "http-status";
import UserService from "./user.service.js";
import sendResponse from "../../utils/sendResponse.js";
import { cookieOptions } from "../../../constant.js";
import AppError from "../../errors/AppError.js";

/**
 *  Creates a new user in the system. It validates the request body,
 * hashes the password, and stores the user in the database.
 * @name createUser
 * @access Public
 */
const createUser = async (req: Request, res: Response) => {
  const data = await UserService.createUserIntoDB(req.body);

  res.status(status.OK).cookie("accessToken", data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000,
  });

  res.cookie("refreshToken", data.refreshToken, {
    ...cookieOptions,
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });

  return sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "User create successfully!",
    data: data.user,
  });
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const data = await UserService.loginUserFromDB(email, password);

  res.status(status.OK).cookie("accessToken", data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000,
  });

  res.cookie("refreshToken", data.refreshToken, {
    ...cookieOptions,
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged in successfully",
    data: data.user,
  });
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  const data = await UserService.refreshAccessTokenFromDB(incomingRefreshToken);

  res.status(status.OK).cookie("accessToken", data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000,
  });
  res.cookie("refreshToken", data.refreshToken, {
    ...cookieOptions,
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Token refreshed",
    data: data.user,
  });
};

const logoutUser = async (req: Request, res: Response) => {
  const incomingToken = req.cookies.refreshToken;
  await UserService.logoutUserAndRemoveTokenFromDB(incomingToken);

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User logged out successfully!!",
    data: null,
  });
};

const getAUserInfo = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }
  const userId = req?.user._id;

  if (!userId || Array.isArray(userId))
    throw new AppError(status.BAD_REQUEST, "Invalid User ID");

  const user = await UserService.getAUserInfoFromDB(userId);

  return sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User fetched successfully",
    data: user,
  });
};

const UserController = {
  createUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getAUserInfo,
};

export default UserController;
