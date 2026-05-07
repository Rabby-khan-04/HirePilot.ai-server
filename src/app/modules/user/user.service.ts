import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import TUser from "./user.inteface.js";
import User from "./user.model.js";
import status from "http-status";

const generateAccessAndRefreshToken = async (userId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(status.NOT_FOUND, "User not found!!");
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  return { accessToken, refreshToken };
};

/**
 * Creates a new user in the database.
 * Checks for existing users by email before creating a new account.
 *
 * @param payload User data for registration
 * @returns Newly created user document
 * @throws AppError Throws an error if validation fails, user already exists,
 * or user creation fails
 */
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

const loginUserFromDB = async function (email: string, password: string) {
  if (!email || !password)
    throw new AppError(
      status.BAD_REQUEST,
      "Credentials are required to login!!",
    );

  const user = await User.findOne({ email }).select({
    password: 1,
    name: 1,
    email: 1,
    role: 1,
    avatar: 1,
  });

  if (!user) throw new AppError(status.UNAUTHORIZED, "Invalid email!!");

  const passwordMatched = await User.isPasswordMatched(password, user.password);

  if (!passwordMatched)
    throw new AppError(status.UNAUTHORIZED, "Unauthorized Access!!");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  return { user, accessToken, refreshToken };
};

const UserService = { createUserIntoDB, loginUserFromDB };

export default UserService;
