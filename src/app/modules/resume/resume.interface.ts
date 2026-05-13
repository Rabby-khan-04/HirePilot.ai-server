import { Types } from "mongoose";

export type ResumeQueryOptions = {
  search?: string;
  statusFilter?: "all" | "pending" | "processing" | "completed" | "failed";
  sortBy?: "mostRecent" | "oldest" | "title";
  page?: number;
  limit?: number;
};

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
  title?: string;
};

export type TProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

type TResume = {
  userId: Types.ObjectId;
  title: string;
  fileUrl?: string | null;
  rawText: string;
  parsedData: TParsedData;
  processingStatus: TProcessingStatus;
  isLatest: boolean;
};

export default TResume;
