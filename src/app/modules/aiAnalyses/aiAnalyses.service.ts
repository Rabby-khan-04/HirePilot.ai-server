import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import Resume from "../resume/resume.model.js";
import JobProfile from "../jobProfile/jobProfile.model.js";
import AiAnalyses from "./aiAnalyses.model.js";
import generateAnalysis from "../../utils/ai/generateanalysis.js";

const computeScore = (
  matchedSkills: string[],
  skillGaps: { skill: string; severity: "low" | "medium" | "high" }[],
): number => {
  const totalSkills = matchedSkills.length + skillGaps.length;
  if (totalSkills === 0) return 0;

  // Base: % of skills matched (0–100)
  const baseScore = (matchedSkills.length / totalSkills) * 100;

  // Penalty: weighted by severity, max 30 points deducted
  const rawPenalty = skillGaps.reduce((acc, gap) => {
    if (gap.severity === "high") return acc + 3;
    if (gap.severity === "medium") return acc + 1.5;
    return acc + 0.5;
  }, 0);

  const penalty = Math.min(rawPenalty, 30);
  const raw = baseScore - penalty;

  return Math.round(Math.min(100, Math.max(0, raw)));
};

const generateAndSaveAnalysis = async (
  userId: Types.ObjectId,
  resumeId: string,
  jobProfileId: string,
) => {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw new AppError(status.NOT_FOUND, "Resume not found");
  }

  if (resume.processingStatus !== "completed") {
    throw new AppError(
      status.BAD_REQUEST,
      "Resume has not been fully processed yet",
    );
  }

  const jobProfile = await JobProfile.findOne({ _id: jobProfileId, userId });
  if (!jobProfile) {
    throw new AppError(status.NOT_FOUND, "Job profile not found");
  }

  const resumeSkills = resume.parsedData?.skills ?? [];
  const resumeExperience = resume.parsedData?.experience ?? [];
  const technicalSkills = jobProfile.extractedData?.technicalSkills ?? [];
  const softSkills = jobProfile.extractedData?.softSkills ?? [];
  const keywords = jobProfile.extractedData?.keywords ?? [];

  const aiResult = await generateAnalysis({
    resumeSkills,
    resumeExperience,
    jobTitle: jobProfile.title,
    technicalSkills,
    softSkills,
    keywords,
  });

  const computedScore = computeScore(
    aiResult.matchedSkills,
    aiResult.skillGaps,
  );
  const finalScore =
    Math.abs(aiResult.score - computedScore) <= 25
      ? aiResult.score
      : computedScore;

  const analysis = await AiAnalyses.create({
    userId,
    resumeId: new Types.ObjectId(resumeId),
    jobProfileId: new Types.ObjectId(jobProfileId),
    score: finalScore,
    matchedSkills: aiResult.matchedSkills,
    skillGaps: aiResult.skillGaps,
    suggestions: aiResult.suggestions,
    technicalQuestions: aiResult.technicalQuestions,
    behavioralQuestions: aiResult.behavioralQuestions,
  });

  if (!analysis) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to save AI analysis",
    );
  }

  return analysis;
};

const getUserAnalyses = async (userId: Types.ObjectId) => {
  return await AiAnalyses.find({ userId })
    .populate("resumeId", "title")
    .populate("jobProfileId", "title")
    .sort({ createdAt: -1 })
    .lean();
};

const getSingleAnalysis = async (id: string, userId: Types.ObjectId) => {
  const analysis = await AiAnalyses.findOne({ _id: id, userId })
    .populate("resumeId", "title")
    .populate("jobProfileId", "title")
    .lean();

  if (!analysis) throw new AppError(status.NOT_FOUND, "Analysis not found");

  return analysis;
};

const AiAnalysesService = {
  generateAndSaveAnalysis,
  getUserAnalyses,
  getSingleAnalysis,
};

export default AiAnalysesService;
