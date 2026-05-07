import { Types } from "mongoose";

export type TTask = {
  text: string;
  isCompleted: boolean;
};

export type TDay = {
  day: number;
  title: string;
  tasks: TTask[];
};

export type TRoadmap = {
  week: number;
  days: TDay[];
};

type TLearningRoadmap = {
  userId: Types.ObjectId;
  analysisId: string;

  title: string;
  duration: string;

  roadmap: TRoadmap[];

  progress: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
  };
};

export default TLearningRoadmap;
