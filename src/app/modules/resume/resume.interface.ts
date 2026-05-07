import { Types } from "mongoose";

export type TExperience = {
  company?: string;
  role?: string;
  description?: string[];
};

export type TProject = {
  name?: string;
  description?: string;
  techStack?: string[];
};

export type TParsedData = {
  skills: string[];
  experience: TExperience[];
  projects: TProject[];
};

type TResume = {
  userId: Types.ObjectId;
  title: string;
  fileUrl?: string;
  rawText: string;
  parsedData: TParsedData;
  isLatest: boolean;
};

export default TResume;
