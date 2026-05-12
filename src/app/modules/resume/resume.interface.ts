import { Types } from "mongoose";

export type TExperience = {
  company?: string | null;
  role?: string | null;
  description?: string[];
};

export type TProject = {
  name?: string | null;
  description?: string | null;
  techStack?: string[];
};

export type TParsedData = {
  skills: string[];
  experience: TExperience[];
  projects: TProject[];
};

export type TProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

type TResume = {
  userId: Types.ObjectId;
  // title: string;
  fileUrl?: string | null;
  rawText: string;
  parsedData: TParsedData;
  processingStatus: TProcessingStatus;
  isLatest: boolean;
};

export default TResume;
