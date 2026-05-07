import { Types } from "mongoose";

export type TSkillGaps = {
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

  skillGaps: TSkillGaps[];

  suggestions: string[];

  technicalQuestions: TQuestion[];

  behavioralQuestions: TQuestion[];
};

export default TAiAnalyses;
