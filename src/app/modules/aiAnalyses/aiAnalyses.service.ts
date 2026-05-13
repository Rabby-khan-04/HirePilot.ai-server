import status from "http-status";
import { PipelineStage, Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import Resume from "../resume/resume.model.js";
import JobProfile from "../jobProfile/jobProfile.model.js";
import AiAnalyses from "./aiAnalyses.model.js";
import generateAnalysis from "../../utils/ai/generateanalysis.js";
import TAiAnalyses, { AnalysesQueryOptions } from "./aiAnalyses.interface.js";

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

const getUserAnalyses = async (
  userId: Types.ObjectId,
  opts: AnalysesQueryOptions = {},
) => {
  const {
    search = "",
    scoreFilter = "all",
    sortBy = "mostRecent",
    page = 1,
    limit = 9,
  } = opts;

  const skip = (page - 1) * limit;

  // ── 1. Sort map ────────────────────────────────────────────────────────────
  type SortSpec = Record<string, 1 | -1>;
  const sortMap: Record<
    NonNullable<AnalysesQueryOptions["sortBy"]>,
    SortSpec
  > = {
    highestMatch: { score: -1 },
    mostRecent: { createdAt: -1 },
    title: { "jobProfile.title": 1 }, // populated field — resolved after $lookup
  };
  const sort = sortMap[sortBy] ?? { createdAt: -1 };

  // ── 2. Pipeline ────────────────────────────────────────────────────────────
  const pipeline: PipelineStage[] = [
    // ── 2a. Scope to this user ───────────────────────────────────────────────
    { $match: { userId } },

    // ── 2b. Join Resume → extract title as `role` ────────────────────────────
    {
      $lookup: {
        from: "resumes",
        localField: "resumeId",
        foreignField: "_id",
        as: "_resume",
      },
    },
    {
      $addFields: {
        role: { $ifNull: [{ $first: "$_resume.title" }, ""] },
      },
    },

    // ── 2c. Join JobProfile → extract title as `title` ───────────────────────
    {
      $lookup: {
        from: "jobprofiles", // mongoose lowercases + pluralises the model name
        localField: "jobProfileId",
        foreignField: "_id",
        as: "_jobProfile",
      },
    },
    {
      $addFields: {
        title: { $ifNull: [{ $first: "$_jobProfile.title" }, ""] },
      },
    },

    // ── 2d. Score filter ─────────────────────────────────────────────────────
    ...(scoreFilter !== "all"
      ? [
          {
            $match: (() => {
              if (scoreFilter === "80-100")
                return { score: { $gte: 80, $lte: 100 } };
              if (scoreFilter === "60-79")
                return { score: { $gte: 60, $lte: 79 } };
              return { score: { $lt: 60 } }; // below-60
            })(),
          } satisfies PipelineStage,
        ]
      : []),

    // ── 2e. Search (title = jobProfile title, role = resume title) ───────────
    ...(search
      ? [
          {
            $match: {
              $or: [
                { title: { $regex: search, $options: "i" } },
                { role: { $regex: search, $options: "i" } },
              ],
            },
          } satisfies PipelineStage,
        ]
      : []),

    // ── 2f. Sort ─────────────────────────────────────────────────────────────
    { $sort: sort },

    // ── 2g. Facet: data page + total count in one round-trip ─────────────────
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              // flat, clean fields ─────────────────────────────────
              title: 1,
              role: 1,
              score: 1,
              createdAt: 1,
              matchedSkills: { $slice: ["$matchedSkills", 4] },
              skillGaps: { $slice: ["$skillGaps", 4] },
              suggestion: { $first: "$suggestions" },
              interviewQuestionsCount: {
                $add: [
                  { $size: "$technicalQuestions" },
                  { $size: "$behavioralQuestions" },
                ],
              },
              // keep ref ids if the client ever needs them
              resumeId: 1,
              jobProfileId: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await AiAnalyses.aggregate(pipeline);
  const analyses = result?.data ?? [];

  const total: number = result?.totalCount?.[0]?.count ?? 0;

  return {
    analyses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

const getSingleAnalysis = async (id: string, userId: Types.ObjectId) => {
  const pipeline: PipelineStage[] = [
    // ── 1. Scope to this user + document ──────────────────────────────────────
    {
      $match: {
        _id: new Types.ObjectId(id),
        userId,
      },
    },

    // ── 2. Join Resume → derive `role` ────────────────────────────────────────
    {
      $lookup: {
        from: "resumes",
        localField: "resumeId",
        foreignField: "_id",
        as: "_resume",
      },
    },
    {
      $addFields: {
        role: { $ifNull: [{ $first: "$_resume.title" }, ""] },
      },
    },

    // ── 3. Join JobProfile → derive `title` ───────────────────────────────────
    {
      $lookup: {
        from: "jobprofiles",
        localField: "jobProfileId",
        foreignField: "_id",
        as: "_jobProfile",
      },
    },
    {
      $addFields: {
        title: { $ifNull: [{ $first: "$_jobProfile.title" }, ""] },
      },
    },

    // ── 4. Project all model fields + derived fields, strip lookup temps ───────
    {
      $project: {
        // derived
        title: 1,
        role: 1,
        // model fields
        userId: 1,
        resumeId: 1,
        jobProfileId: 1,
        score: 1,
        matchedSkills: 1,
        skillGaps: 1, // [{ skill, severity }]
        suggestions: 1, // full array (not sliced like list view)
        technicalQuestions: 1, // [{ question, intention, answer }]
        behavioralQuestions: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const [analysis] = await AiAnalyses.aggregate<
    TAiAnalyses & {
      title: string;
      role: string;
    }
  >(pipeline);

  if (!analysis) throw new AppError(status.NOT_FOUND, "Analysis not found");

  return analysis;
};

const AiAnalysesService = {
  generateAndSaveAnalysis,
  getUserAnalyses,
  getSingleAnalysis,
};

export default AiAnalysesService;
