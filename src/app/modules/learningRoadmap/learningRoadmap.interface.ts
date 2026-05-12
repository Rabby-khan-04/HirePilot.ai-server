import { Types } from "mongoose";

export type TTask = {
  _id?: Types.ObjectId;
  text: string;
  resource?: string;
  isCompleted: boolean;
};

export type TDay = {
  day: number;
  title: string;
  tasks: TTask[];
};

export type TWeek = {
  week: number;
  focus: string;
  days: TDay[];
};

export type TProgress = {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
};

type TLearningRoadmap = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  analysisId: Types.ObjectId;
  title: string;
  duration: string;
  category: string;
  skills: string[];
  roadmap: TWeek[];
  progress: TProgress;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RoadmapQueryOptions = {
  search: string;
  statusFilter: "all" | "completed" | "in-progress" | "not-started";
  durationFilter: string; // e.g. "week", "month", "all"
  sortBy: "updatedAt" | "progress" | "title";
};

export default TLearningRoadmap;
