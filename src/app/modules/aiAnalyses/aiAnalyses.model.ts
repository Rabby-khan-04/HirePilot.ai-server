import { Schema, model, Types } from "mongoose";
import TAiAnalyses from "./aiAnalyses.interface.js";

const skillGapSchema = new Schema(
  {
    skill: {
      type: String,
      required: [true, "Skill is required"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: [true, "Severity is required"],
    },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
    },
    intention: {
      type: String,
      required: [true, "Intention is required"],
    },
    answer: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const aiAnalysesSchema = new Schema<TAiAnalyses>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    resumeId: {
      type: Types.ObjectId,
      ref: "Resume",
      required: [true, "Resume ID is required"],
    },

    jobProfileId: {
      type: Types.ObjectId,
      ref: "JobProfile",
      required: [true, "Job profile ID is required"],
    },

    score: {
      type: Number,
      required: [true, "Score is required"],
      min: 0,
      max: 100,
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    skillGaps: {
      type: [skillGapSchema],
      default: [],
    },

    suggestions: {
      type: [String],
      default: [],
    },

    technicalQuestions: {
      type: [questionSchema],
      default: [],
    },

    behavioralQuestions: {
      type: [questionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const AiAnalyses = model<TAiAnalyses>("AiAnalyses", aiAnalysesSchema);

export default AiAnalyses;
