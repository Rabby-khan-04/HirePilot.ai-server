import { Types } from "mongoose";

export type TExtractedData = {
  technicalSkills: string[];
  softSkills: string[];
  experienceLevel: string | null;
  keywords?: string[];
};

export type TJobProfile = {
  userId: Types.ObjectId;

  title: string;

  jobDescription?: string;

  isAiGeneratedDescription: boolean;

  extractedData?: TExtractedData;
};

export default TJobProfile;
