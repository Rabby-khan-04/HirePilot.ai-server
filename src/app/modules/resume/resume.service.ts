import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import extractPdfText from "../../utils/pdf/extractPdfText.js";
import parseResumeWithAI from "../../utils/ai/parseResumeWithAI.js";
import Resume from "./resume.model.js";

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
    title: payload.title,
    fileUrl: payload.fileUrl,
    rawText: "",
    parsedData: { skills: [], experience: [], projects: [] },
    processingStatus: "processing",
    isLatest: false,
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
  const resume = await Resume.findOne({ _id: resumeId, userId }).select({
    rawText: 0,
  });
  if (!resume) {
    throw new AppError(status.NOT_FOUND, "Resume not found");
  }

  return resume;
};

const getAllResumeFromDB = async (userId: Types.ObjectId) => {
  const resume = await Resume.find({ userId }).select({
    rawText: 0,
  });
  if (!resume) {
    throw new AppError(status.NOT_FOUND, "Resume not found");
  }

  return resume;
};

const ResumeService = {
  createResumeIntoDB,
  retryResumeParsing,
  getAResumeFromDB,
  getAllResumeFromDB,
};

export default ResumeService;
