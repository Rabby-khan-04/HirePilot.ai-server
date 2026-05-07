import AppError from "../../errors/AppError.js";
import TUser from "./user.inteface.js";
import User from "./user.model.js";
import status from "http-status";

const createUserIntoDB = async (payload: TUser) => {
  const isUserExists = await User.isUserExistsByEmail(payload.email);
  if (!isUserExists)
    throw new AppError(status.CONFLICT, "User with this email already exists");
};

const UserService = {};

export default UserService;
