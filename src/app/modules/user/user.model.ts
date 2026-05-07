import { Schema, model } from "mongoose";
import TUser, { UserModel } from "./user.inteface.js";
import bcrypt from "bcrypt";
import { config } from "../../config/index.js";

const userSchema = new Schema<TUser>(
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
  },
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret: Record<string, unknown>) {
    delete ret.password;
    return ret;
  },
});

userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round),
  );
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  const result = await User.findOne({ email });
  return result;
};

userSchema.statics.isPasswordMatched = async function (
  plainPassword,
  hashPassword,
) {
  const passwordMatched = await bcrypt.compare(plainPassword, hashPassword);

  return passwordMatched;
};

const User = model<TUser, UserModel>("User", userSchema);

export default User;
