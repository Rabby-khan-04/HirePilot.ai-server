import { Model } from "mongoose";

type TUser = {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: "user" | "admin";
  refreshToken?: string;
};

export interface UserModel extends Model<TUser> {
  isUserExistsByEmail(email: string): Promise<TUser | null>;
  isPasswordMatched(
    plainPassword: string,
    hashPassword: string,
  ): Promise<boolean>;
}

export default TUser;
