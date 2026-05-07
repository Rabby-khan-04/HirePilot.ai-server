import { Schema, model, Types } from "mongoose";
import TJobProfile from "./jobProfile.interface.js";

const jobProfileSchema = new Schema<TJobProfile>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    jobDescription: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const JobProfile = model<TJobProfile>("JobProfile", jobProfileSchema);

export default JobProfile;
