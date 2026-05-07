import { Schema, model, Types } from "mongoose";
import TJobApplication from "./jobApplication.interface.js";

const jobApplicationSchema = new Schema<TJobApplication>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    roleTitle: {
      type: String,
      required: [true, "Role title is required"],
      trim: true,
    },

    jobUrl: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["saved", "applied", "interview", "offer", "rejected"],
        message: "Invalid application status",
      },
      default: "saved",
    },

    appliedDate: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const JobApplication = model<TJobApplication>(
  "JobApplication",
  jobApplicationSchema,
);

export default JobApplication;
