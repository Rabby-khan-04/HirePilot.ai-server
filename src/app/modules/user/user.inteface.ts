import { Model } from "mongoose";

type TUser = {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: "user" | "admin";
  refreshToken?: string;
};

export interface UserMethods {
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface UserModel extends Model<
  TUser,
  Record<string, unknown>,
  UserMethods
> {
  isUserExistsByEmail(email: string): Promise<TUser | null>;
  isPasswordMatched(
    plainPassword: string,
    hashPassword: string,
  ): Promise<boolean>;
}

export default TUser;
