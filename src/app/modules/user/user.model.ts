import { Schema, model } from "mongoose";
import TUser, { UserMethods, UserModel } from "./user.inteface.js";
import bcrypt from "bcrypt";
import { config } from "../../config/index.js";
import jwt from "jsonwebtoken";

const userSchema = new Schema<TUser, UserModel, UserMethods>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    avatar: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret: Record<string, unknown>) {
    delete ret.password;
    return ret;
  },
});

/**
 * Hashes user password before saving to the database.
 *
 * @hook pre("save")
 */
userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round),
  );
});

/**
 * Generates a signed JWT access token for authenticated user sessions.
 *
 * @returns  JWT access token
 */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    config.access_token_secret,
    { expiresIn: config.access_token_expiry },
  );
};

/**
 * Generates a signed JWT refresh token for session renewal.
 *
 * @returns  JWT refresh token
 */
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, config.refresh_token_secret, {
    expiresIn: config.refresh_token_expiry,
  });
};

/**
 * Checks whether a user exists by email.
 *
 * @param email User email address
 * @returns Found user or null
 */
userSchema.statics.isUserExistsByEmail = async function (email: string) {
  const result = await User.findOne({ email });
  return result;
};

/**
 * Compares a plain password with a hashed password.
 *
 * @param plainPassword Plain text password
 * @param hashPassword Hashed password from database
 * @returns Whether passwords match
 */

userSchema.statics.isPasswordMatched = async function (
  plainPassword,
  hashPassword,
) {
  const passwordMatched = await bcrypt.compare(plainPassword, hashPassword);

  return passwordMatched;
};

/**
 * User model representing application users.
 * Handles authentication, password hashing, and token generation.
 *
 * @model User
 */

const User = model<TUser, UserModel>("User", userSchema);

export default User;
