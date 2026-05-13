import status from "http-status";
import { PipelineStage, Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import extractPdfText from "../../utils/pdf/extractPdfText.js";
import parseResumeWithAI from "../../utils/ai/parseResumeWithAI.js";
import Resume from "./resume.model.js";
import { ResumeQueryOptions } from "./resume.interface.js";

export type TCreateResumePayload = {
  title: string;
  fileUrl: string;
};

const createResumeIntoDB = async (
  userId: Types.ObjectId,
  payload: TCreateResumePayload,
) => {
  // Step 1 — create new resume document
  // isLatest starts false — only set true after AI succeeds
  const resume = await Resume.create({
    userId,
    title: "Software Engineer",
    fileUrl: payload.fileUrl,
    rawText: "",
    parsedData: { skills: [], experience: [], projects: [] },
    processingStatus: "processing",
    isLatest: false,
    score: 0,
    insights: {},
  });

  if (!resume) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to create resume document",
    );
  }

  // Step 2 — extract raw text and save immediately
  let rawText = "";

  try {
    rawText = await extractPdfText(payload.fileUrl);

    await Resume.findByIdAndUpdate(resume._id, {
      rawText,
      processingStatus: "processing",
    });
  } catch {
    await Resume.findByIdAndUpdate(resume._id, {
      processingStatus: "failed",
    });

    return await Resume.findById(resume._id);
  }

  // Step 3 — parse with AI
  try {
    const parsedData = await parseResumeWithAI(rawText);

    // ✅ AI succeeded — now demote all previous resumes then promote this one
    // Both in one atomic-ish sequence to avoid a window where no resume is latest

    const title = parsedData.title;
    const insights = parsedData.insights;
    const score = parsedData.score;
    delete parsedData.insights;
    delete parsedData.title;
    delete parsedData.score;

    await Resume.updateMany(
      {
        userId,
        _id: { $ne: resume._id }, // exclude the new one
        isLatest: true,
      },
      { isLatest: false },
    );

    await Resume.findByIdAndUpdate(resume._id, {
      parsedData,
      title,
      insights,
      score,
      processingStatus: "completed",
      isLatest: true, // ✅ only becomes latest after AI succeeds
    });
  } catch {
    // AI failed — new resume stays isLatest: false
    // Previous latest resume remains latest — user still has a working one
    await Resume.findByIdAndUpdate(resume._id, {
      processingStatus: "failed",
    });
  }

  return await Resume.findById(resume._id);
};

const retryResumeParsing = async (resumeId: string, userId: Types.ObjectId) => {
  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new AppError(status.NOT_FOUND, "Resume not found");
  }

  if (!resume.rawText) {
    throw new AppError(
      status.BAD_REQUEST,
      "No raw text found. Please re-upload the resume",
    );
  }

  if (resume.processingStatus === "completed") {
    throw new AppError(status.BAD_REQUEST, "Resume is already parsed");
  }

  await Resume.findByIdAndUpdate(resumeId, {
    processingStatus: "processing",
  });

  try {
    const parsedData = await parseResumeWithAI(resume.rawText);

    // ✅ Same logic — demote previous, promote this one
    await Resume.updateMany(
      {
        userId,
        _id: { $ne: resume._id },
        isLatest: true,
      },
      { isLatest: false },
    );

    await Resume.findByIdAndUpdate(resumeId, {
      parsedData,
      processingStatus: "completed",
      isLatest: true,
    });
  } catch {
    await Resume.findByIdAndUpdate(resumeId, {
      processingStatus: "failed",
    });
  }

  return await Resume.findById(resumeId);
};

const getAResumeFromDB = async (resumeId: string, userId: Types.ObjectId) => {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw new AppError(status.NOT_FOUND, "Resume not found");
  }

  return resume;
};

const getAllResumeFromDB = async (
  userId: Types.ObjectId,
  opts: ResumeQueryOptions = {},
) => {
  const {
    search = "",
    statusFilter = "all",
    sortBy = "mostRecent",
    page = 1,
    limit = 9,
  } = opts;

  const skip = (page - 1) * limit;

  // ── Sort map ───────────────────────────────────────────────────────────────
  type SortSpec = Record<string, 1 | -1>;
  const sortMap: Record<NonNullable<ResumeQueryOptions["sortBy"]>, SortSpec> = {
    mostRecent: { createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
  };
  const sort = sortMap[sortBy] ?? { createdAt: -1 };

  // ── Pipeline ───────────────────────────────────────────────────────────────
  const pipeline: PipelineStage[] = [
    // ── 1. Scope to this user ────────────────────────────────────────────────
    { $match: { userId } },

    // ── 2. Status filter ─────────────────────────────────────────────────────
    ...(statusFilter !== "all"
      ? [{ $match: { processingStatus: statusFilter } } satisfies PipelineStage]
      : []),

    // ── 3. Search (title only) ───────────────────────────────────────────────
    ...(search
      ? [
          {
            $match: { title: { $regex: search, $options: "i" } },
          } satisfies PipelineStage,
        ]
      : []),

    // ── 4. Sort ──────────────────────────────────────────────────────────────
    { $sort: sort },

    // ── 5. Facet: data page + total count in one round-trip ──────────────────
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              rawText: 0, // excluded — can be large, not needed for list
              __v: 0,
              fileUrl: 0,
            },
          },
        ],
        stats: [
          {
            $group: {
              _id: "$processingStatus",
              count: { $sum: 1 },
            },
          },
        ],
        totalCount: [{ $count: "count" }],

        // ── Derived flag: is there already a latest resume? ──────────────────
        // Lets the client know whether the "mark as latest" action is available
        latestExists: [{ $match: { isLatest: true } }, { $count: "count" }],
      },
    },
  ];

  const [result] = await Resume.aggregate(pipeline);

  const resumes = result?.data ?? [];
  const total: number = result?.totalCount?.[0]?.count ?? 0;
  const hasLatest: boolean = (result?.latestExists?.[0]?.count ?? 0) > 0;

  return {
    resumes,
    hasLatest,
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

const ResumeService = {
  createResumeIntoDB,
  retryResumeParsing,
  getAResumeFromDB,
  getAllResumeFromDB,
};

export default ResumeService;
