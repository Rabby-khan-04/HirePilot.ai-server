import { Types } from "mongoose";

export type TExtractedData = {
  technicalSkills: string[];
  softSkills: string[];
  experienceLevel?: string;
  keywords?: string[];
};

type TJobProfile = {
  userId: Types.ObjectId;
  title: string;
  jobDescription?: string;
};

export default TJobProfile;
