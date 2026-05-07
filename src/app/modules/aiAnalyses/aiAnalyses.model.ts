import { Schema, model, Types } from "mongoose";
import TAiAnalyses from "./aiAnalyses.interface.js";

const skillGapSchema = new Schema(
  {
    skill: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    question: { type: String, required: true },
    intention: { type: String, required: true },
    answer: { type: String, default: "" },
  },
  { _id: false },
);

const aiAnalysesSchema = new Schema<TAiAnalyses>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumeId: {
      type: Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    jobProfileId: {
      type: Types.ObjectId,
      ref: "JobProfile",
      required: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
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
