import { Schema, model, Types } from "mongoose";
import TJobProfile from "./jobProfile.interface.js";

const jobProfileSchema = new Schema<TJobProfile>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    jobDescription: {
      type: String,
      default: "",
    },

    isAiGeneratedDescription: {
      type: Boolean,
      default: false,
    },

    extractedData: {
      technicalSkills: {
        type: [String],
        default: [],
      },

      softSkills: {
        type: [String],
        default: [],
      },

      experienceLevel: {
        type: String,
        default: null,
      },

      keywords: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  },
);

const JobProfile = model<TJobProfile>("JobProfile", jobProfileSchema);

export default JobProfile;
