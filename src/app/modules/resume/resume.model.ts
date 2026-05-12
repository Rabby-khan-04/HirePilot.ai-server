import { Schema, Types, model } from "mongoose";
import TResume from "./resume.interface";

const resumeSchema = new Schema<TResume>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    title: {
      type: String,
      required: [true, "Resume title is required"],
      trim: true,
    },

    fileUrl: {
      type: String,
      default: null,
    },

    rawText: {
      type: String,
      default: "",
    },

    parsedData: {
      type: {
        skills: {
          type: [String],
          default: [],
        },

        experience: [
          {
            company: {
              type: String,
              default: null,
            },

            role: {
              type: String,
              default: null,
            },

            description: {
              type: [String],
              default: [],
            },
          },
        ],

        projects: [
          {
            name: {
              type: String,
              default: null,
            },

            description: {
              type: String,
              default: null,
            },

            techStack: {
              type: [String],
              default: [],
            },
          },
        ],
      },

      default: {
        skills: [],
        experience: [],
        projects: [],
      },
    },

    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    isLatest: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

resumeSchema.index({ userId: 1 });

const Resume = model<TResume>("Resume", resumeSchema);

export default Resume;
