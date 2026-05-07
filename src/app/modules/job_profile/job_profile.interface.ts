export type TExtractedData = {
  technicalSkills: string[];
  softSkills: string[];
  experienceLevel?: string;
  keywords?: string[];
};

type TJobProfile = {
  userId: string;
  title: string;
  jobDescription?: string;
};

export default TJobProfile;
