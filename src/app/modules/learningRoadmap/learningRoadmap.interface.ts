// learningRoadmap.interface.ts

import { Types } from "mongoose";

export type TTask = {
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

type TLearningRoadmap = {
  userId: Types.ObjectId;

  analysisId: Types.ObjectId;

  title: string;

  duration: string;

  roadmap: TWeek[];

  progress: {
    totalTasks: number;

    completedTasks: number;

    percentage: number;
  };
};

export default TLearningRoadmap;
