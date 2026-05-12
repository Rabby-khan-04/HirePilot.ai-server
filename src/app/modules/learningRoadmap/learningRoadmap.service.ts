import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError.js";
import AiAnalyses from "../aiAnalyses/aiAnalyses.model.js";
import LearningRoadmap from "./learningRoadmap.model.js";

import calculateRoadmapProgress from "../../utils/calculateRoadmapProgress.js";
import generateLearningRoadmap from "../../utils/ai/generateLearningRoadmap.js";
import { RoadmapQueryOptions } from "./learningRoadmap.interface.js";

// ─── Generate Roadmap ──────────────────────────────────────────────────────────

const generateAndSaveRoadmap = async (
  userId: Types.ObjectId,
  analysisId: string,
) => {
  // 1. Validate analysisId and ownership
  const analysis = await AiAnalyses.findOne({
    _id: analysisId,
    userId,
  }).lean();

  if (!analysis) {
    throw new AppError(
      status.NOT_FOUND,
      "Analysis not found or does not belong to you",
    );
  }

  // 2. Check for existing roadmap (one roadmap per analysis per user)
  const existing = await LearningRoadmap.findOne({
    userId,
    analysisId: new Types.ObjectId(analysisId),
  }).lean();

  if (existing) {
    return existing;
  }

  // 3. Extract AI input data from analysis
  const { score, skillGaps, suggestions, matchedSkills } = analysis;

  // 4. Call Gemini AI
  const aiResult = await generateLearningRoadmap({
    score,
    skillGaps,
    suggestions,
    matchedSkills,
  });

  // 5. Calculate initial progress (all tasks uncompleted)
  const progress = calculateRoadmapProgress(
    aiResult.roadmap.map((w) => ({
      ...w,
      days: w.days.map((d) => ({
        ...d,
        tasks: d.tasks.map((t) => ({ ...t, isCompleted: false })),
      })),
    })),
  );
  const skills = skillGaps.map((g) => g.skill);

  // 6. Save roadmap
  const roadmap = await LearningRoadmap.create({
    userId,
    analysisId: new Types.ObjectId(analysisId),
    title: aiResult.title,
    duration: aiResult.duration,
    category: aiResult.category,
    skills,
    roadmap: aiResult.roadmap.map((w) => ({
      ...w,
      days: w.days.map((d) => ({
        ...d,
        tasks: d.tasks.map((t) => ({
          text: t.text,
          resource: t.resource ?? "",
          isCompleted: false,
        })),
      })),
    })),
    progress,
  });

  if (!roadmap) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to save learning roadmap",
    );
  }

  return roadmap;
};

// ─── Get All User Roadmaps ─────────────────────────────────────────────────────

const getUserRoadmaps = async (
  userId: Types.ObjectId,
  opts: RoadmapQueryOptions,
) => {
  const { search, statusFilter, durationFilter, sortBy } = opts;

  // ── 1. Base match ─────────────────────────────────────────────────────────
  const filter: Record<string, unknown> = { userId };

  // ── 2. Full-text / substring search (title | category | skills) ───────────
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { title: regex },
      { category: regex },
      { skills: regex }, // array field — Mongo matches any element
    ];
  }

  // ── 3. Duration filter ────────────────────────────────────────────────────
  if (durationFilter && durationFilter !== "all") {
    filter.duration = new RegExp(durationFilter, "i");
  }

  // ── 4. Progress / status filter ───────────────────────────────────────────
  //   Stored as a number (0-100) in progress.percentage
  if (statusFilter === "completed") {
    filter["progress.percentage"] = 100;
  } else if (statusFilter === "not-started") {
    filter["progress.percentage"] = 0;
  } else if (statusFilter === "in-progress") {
    filter["progress.percentage"] = { $gt: 0, $lt: 100 };
  }

  // ── 5. Sort ───────────────────────────────────────────────────────────────
  type SortSpec = Record<string, 1 | -1>;
  const sortMap: Record<RoadmapQueryOptions["sortBy"], SortSpec> = {
    updatedAt: { updatedAt: -1 },
    progress: { "progress.percentage": -1 },
    title: { title: 1 },
  };
  const sort = sortMap[sortBy] ?? { updatedAt: -1 };

  // ── 6. Query ──────────────────────────────────────────────────────────────
  return await LearningRoadmap.find(filter)
    .populate("analysisId", "score")
    .sort(sort)
    .lean();
};

// ─── Get Single Roadmap ────────────────────────────────────────────────────────

const getSingleRoadmap = async (roadmapId: string, userId: Types.ObjectId) => {
  const roadmap = await LearningRoadmap.findOne({
    _id: roadmapId,
    userId,
  })
    .populate("analysisId", "score")
    .lean();

  if (!roadmap) {
    throw new AppError(
      status.NOT_FOUND,
      "Roadmap not found or does not belong to you",
    );
  }

  return roadmap;
};

// ─── Toggle Task Completion ────────────────────────────────────────────────────

const toggleTaskCompletion = async (
  roadmapId: string,
  taskId: string,
  userId: Types.ObjectId,
) => {
  // Fetch the full document (not lean) so we can mutate and save
  const roadmap = await LearningRoadmap.findOne({ _id: roadmapId, userId });

  if (!roadmap) {
    throw new AppError(
      status.NOT_FOUND,
      "Roadmap not found or does not belong to you",
    );
  }

  // Find and toggle the task
  let taskFound = false;

  for (const week of roadmap.roadmap) {
    for (const day of week.days) {
      for (const task of day.tasks) {
        if (task._id?.toString() === taskId) {
          task.isCompleted = !task.isCompleted;
          taskFound = true;
          break;
        }
      }
      if (taskFound) break;
    }
    if (taskFound) break;
  }

  if (!taskFound) {
    throw new AppError(status.NOT_FOUND, "Task not found in this roadmap");
  }

  // Recalculate progress
  roadmap.progress = calculateRoadmapProgress(roadmap.roadmap);

  await roadmap.save();

  return roadmap;
};

// ─── Delete Roadmap ────────────────────────────────────────────────────────────

const deleteRoadmap = async (roadmapId: string, userId: Types.ObjectId) => {
  const roadmap = await LearningRoadmap.findOneAndDelete({
    _id: roadmapId,
    userId,
  });

  if (!roadmap) {
    throw new AppError(
      status.NOT_FOUND,
      "Roadmap not found or does not belong to you",
    );
  }

  return roadmap;
};

const LearningRoadmapService = {
  generateAndSaveRoadmap,
  getUserRoadmaps,
  getSingleRoadmap,
  toggleTaskCompletion,
  deleteRoadmap,
};

export default LearningRoadmapService;
