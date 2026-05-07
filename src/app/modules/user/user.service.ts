import AppError from "../../errors/AppError.js";
import TUser from "./user.inteface.js";
import User from "./user.model.js";
import status from "http-status";

const createUserIntoDB = async (payload: TUser) => {
  const isUserExists = await User.isUserExistsByEmail(payload.email);

  if (!payload.name) throw new AppError(status.BAD_REQUEST, "Name is required");
  if (!payload.email)
    throw new AppError(status.BAD_REQUEST, "Email is required");
  if (!payload.password)
    throw new AppError(status.BAD_REQUEST, "Password is required");

  if (isUserExists)
    throw new AppError(status.CONFLICT, "User with this email already exists");

  const user = await User.create(payload);

  if (!user)
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Faild to register user!");

  return user;
};

const UserService = { createUserIntoDB };

export default UserService;
