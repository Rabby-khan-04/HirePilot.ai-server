import { Types } from "mongoose";

export type TSkillGap = {
  skill: string;
  severity: "low" | "medium" | "high";
};

export type TQuestion = {
  question: string;
  intention: string;
  answer: string;
};

type TAiAnalyses = {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId;
  jobProfileId: Types.ObjectId;
  score: number;
  matchedSkills: string[];
  skillGaps: TSkillGap[];
  suggestions: string[];
  technicalQuestions: TQuestion[];
  behavioralQuestions: TQuestion[];
};

export interface AnalysesQueryOptions {
  search?: string;
  scoreFilter?: "all" | "80-100" | "60-79" | "below-60";
  sortBy?: "highestMatch" | "mostRecent" | "title";
  page?: number;
  limit?: number;
}

export default TAiAnalyses;
