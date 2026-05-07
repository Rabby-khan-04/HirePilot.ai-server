import { Request, Response } from "express";
import status from "http-status";
import UserService from "./user.service.js";
import sendResponse from "../../utils/sendResponse.js";

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

const UserController = { createUser };

export default UserController;
