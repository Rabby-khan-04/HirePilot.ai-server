import { Schema, model, Types } from "mongoose";
import TLearningRoadmap from "./learningRoadmap.interface.js";

const taskSchema = new Schema({
  text: { type: String, required: true },
  resource: { type: String, default: "" },
  isCompleted: { type: Boolean, default: false },
});

const daySchema = new Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    tasks: { type: [taskSchema], default: [] },
  },
  { _id: false },
);

const weekSchema = new Schema(
  {
    week: { type: Number, required: true },
    focus: { type: String, required: true },
    days: { type: [daySchema], default: [] },
  },
  { _id: false },
);

const progressSchema = new Schema(
  {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  },
  { _id: false },
);

const learningRoadmapSchema = new Schema<TLearningRoadmap>(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    analysisId: { type: Types.ObjectId, ref: "AiAnalyses", required: true },
    title: { type: String, required: true },
    duration: { type: String, required: true },
    category: { type: String, required: true },
    skills: { type: [String], default: [] },
    roadmap: { type: [weekSchema], default: [] },
    progress: { type: progressSchema, required: true },
  },
  { timestamps: true },
);
// Enforce one roadmap per analysis per user
learningRoadmapSchema.index({ userId: 1, analysisId: 1 }, { unique: true });
learningRoadmapSchema.index({ userId: 1 });

const LearningRoadmap = model<TLearningRoadmap>(
  "LearningRoadmap",
  learningRoadmapSchema,
);

export default LearningRoadmap;
