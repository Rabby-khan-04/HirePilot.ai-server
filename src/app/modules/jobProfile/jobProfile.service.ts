import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import generateJobDescription from "../../utils/ai/generateJobDescription.js";
import extractJobData from "../../utils/ai/extractJobData.js";
import JobProfile from "./jobProfile.model.js";

export type TCreateJobProfilePayload = {
  title: string;
  jobDescription?: string;
};

const getTopItems = (freq: Record<string, number>, top: number): string[] => {
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, top)
    .map(([item]) => item);
};

const countFrequency = (items: string[]): Record<string, number> => {
  return items.reduce(
    (acc, item) => {
      const key = item.toLowerCase().trim();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
};

const createJobProfileIntoDB = async (
  userId: Types.ObjectId,
  payload: TCreateJobProfilePayload,
) => {
  const hasUserDescription = !!payload.jobDescription?.trim();

  // Step 1 — resolve job description
  let jobDescription: string;
  let isAiGeneratedDescription: boolean;

  if (hasUserDescription) {
    jobDescription = payload.jobDescription!;
    isAiGeneratedDescription = false;
  } else {
    jobDescription = await generateJobDescription(payload.title);
    isAiGeneratedDescription = true;
  }

  // Step 2 — extract structured data from job description
  const extractedData = await extractJobData(jobDescription);

  // Step 3 — save to DB
  const jobProfile = await JobProfile.create({
    userId,
    title: payload.title,
    jobDescription,
    isAiGeneratedDescription,
    extractedData,
  });

  if (!jobProfile) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to create job profile",
    );
  }

  return jobProfile;
};

const getAllJobProfilesFromDB = async (userId: Types.ObjectId) => {
  const jobProfiles = await JobProfile.find({ userId }).sort({ createdAt: -1 });
  return jobProfiles;
};

const getSingleJobProfileFromDB = async (
  id: string,
  userId: Types.ObjectId,
) => {
  const jobProfile = await JobProfile.findOne({ _id: id, userId });

  if (!jobProfile) {
    throw new AppError(status.NOT_FOUND, "Job profile not found");
  }

  return jobProfile;
};

const getJobAnalysisFromDB = async (userId: Types.ObjectId) => {
  const profiles = await JobProfile.find({ userId }).lean();

  if (!profiles.length) {
    throw new AppError(status.NOT_FOUND, "No job profiles found to analyze");
  }

  // Flatten all skills/keywords across every profile
  const allTechnicalSkills = profiles.flatMap(
    (p) => p.extractedData?.technicalSkills ?? [],
  );
  const allSoftSkills = profiles.flatMap(
    (p) => p.extractedData?.softSkills ?? [],
  );
  const allKeywords = profiles.flatMap((p) => p.extractedData?.keywords ?? []);

  // Experience level breakdown — how many profiles per level
  const experienceLevelBreakdown = profiles.reduce(
    (acc, p) => {
      const level =
        p.extractedData?.experienceLevel?.toLowerCase().trim() ?? "unspecified";
      acc[level] = (acc[level] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // AI vs real description count
  const aiGeneratedCount = profiles.filter(
    (p) => p.isAiGeneratedDescription,
  ).length;

  return {
    totalProfiles: profiles.length,
    aiGeneratedDescriptions: aiGeneratedCount,
    userProvidedDescriptions: profiles.length - aiGeneratedCount,

    topTechnicalSkills: getTopItems(countFrequency(allTechnicalSkills), 15),
    topSoftSkills: getTopItems(countFrequency(allSoftSkills), 10),
    topKeywords: getTopItems(countFrequency(allKeywords), 20),

    technicalSkillsFrequency: countFrequency(allTechnicalSkills),
    softSkillsFrequency: countFrequency(allSoftSkills),

    experienceLevelBreakdown,

    // Most targeted job titles
    jobTitles: profiles.map((p) => p.title),
  };
};

const JobProfileService = {
  createJobProfileIntoDB,
  getAllJobProfilesFromDB,
  getSingleJobProfileFromDB,
  getJobAnalysisFromDB,
};

export default JobProfileService;
