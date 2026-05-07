import { Request, Response } from "express";
import status from "http-status";
import UserService from "./user.service.js";
import sendResponse from "../../utils/sendResponse.js";
import { cookieOptions } from "../../../constant.js";

/**
 *  Creates a new user in the system. It validates the request body,
 * hashes the password, and stores the user in the database.
 * @name createUser
 * @access Public
 */
const createUser = async (req: Request, res: Response) => {
  const user = await UserService.createUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "User create successfully!",
    data: user,
  });
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await UserService.loginUserFromDB(email, password);

  res
    .status(status.OK)
    .cookie("accessToken", data.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    })
    .cookie("refreshToken", data.refreshToken, {
      ...cookieOptions,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged in successfully",
    data: data.user,
  });
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  const data = await UserService.refreshAccessTokenFromDB(incomingRefreshToken);

  res
    .status(status.OK)
    .cookie("accessToken", data.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    })
    .cookie("refreshToken", data.refreshToken, {
      ...cookieOptions,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Token refreshed",
    data: data.user,
  });
};

const UserController = { createUser, loginUser, refreshAccessToken };

export default UserController;
