export type TSkillGaps = {
  skill: string;
  severity: "low" | "medium" | "high";
};

export type TTechnicalQuestions = {
  question: string;
  intention: string;
  answer: string;
};

export type TBehavioralQuestions = {
  question: string;
  intention: string;
  answer: string;
};

type TAiAnalyses = {
  userId: string;
  resumeId: string;
  jobProfileId: string;

  score: number;

  matchedSkills: string[];

  skillGaps: TSkillGaps[];

  suggestions: string[];

  technicalQuestions: TTechnicalQuestions[];

  behavioralQuestions: TBehavioralQuestions[];
};

export default TAiAnalyses;
