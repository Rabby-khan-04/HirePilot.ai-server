import { Types } from "mongoose";
import Resume from "../resume/resume.model.js";
import AiAnalyses from "../aiAnalyses/aiAnalyses.model.js";
import LearningRoadmap from "../learningRoadmap/learningRoadmap.model.js";

const getUsersDashboardStats = async (userId: Types.ObjectId) => {
  // ── Run all aggregations in parallel ──────────────────────────────────────
  const [resumeStats, analysisStats, roadmapStats] = await Promise.all([
    // ── 1. Resume stats ──────────────────────────────────────────────────────
    Resume.aggregate([
      { $match: { userId } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: "$processingStatus",
                count: { $sum: 1 },
              },
            },
          ],
          latest: [
            { $match: { isLatest: true } },
            {
              $project: {
                title: 1,
                score: 1,
                processingStatus: 1,
                "insights.strength": 1,
                "insights.improvement": 1,
                skillsCount: { $size: { $ifNull: ["$parsedData.skills", []] } },
                experienceCount: {
                  $size: { $ifNull: ["$parsedData.experience", []] },
                },
                projectsCount: {
                  $size: { $ifNull: ["$parsedData.projects", []] },
                },
              },
            },
          ],
          topSkills: [
            { $match: { processingStatus: "completed" } },
            { $unwind: "$parsedData.skills" },
            {
              $group: {
                _id: "$parsedData.skills",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $project: { skill: "$_id", count: 1, _id: 0 } },
          ],
        },
      },
    ]),

    // ── 2. Analysis stats ────────────────────────────────────────────────────
    AiAnalyses.aggregate([
      { $match: { userId } },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgScore: { $avg: "$score" },
                bestScore: { $max: "$score" },
                strongMatches: {
                  $sum: { $cond: [{ $gte: ["$score", 80] }, 1, 0] },
                },
                totalTechQuestions: { $sum: { $size: "$technicalQuestions" } },
                totalBehavQuestions: {
                  $sum: { $size: "$behavioralQuestions" },
                },
                answeredTechQuestions: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$technicalQuestions",
                        as: "q",
                        cond: { $ne: ["$$q.answer", ""] },
                      },
                    },
                  },
                },
                answeredBehavQuestions: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$behavioralQuestions",
                        as: "q",
                        cond: { $ne: ["$$q.answer", ""] },
                      },
                    },
                  },
                },
              },
            },
          ],
          topSkillGaps: [
            { $unwind: "$skillGaps" },
            {
              $group: {
                _id: "$skillGaps.skill",
                count: { $sum: 1 },
                // if a skill appears as high in any analysis, surface that
                severity: { $max: "$skillGaps.severity" },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
            {
              $project: {
                skill: "$_id",
                count: 1,
                severity: 1,
                _id: 0,
              },
            },
          ],
          topMatchedSkills: [
            { $unwind: "$matchedSkills" },
            {
              $group: {
                _id: "$matchedSkills",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $project: { skill: "$_id", count: 1, _id: 0 } },
          ],
          bestAnalysis: [
            { $sort: { score: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "jobprofiles",
                localField: "jobProfileId",
                foreignField: "_id",
                as: "_job",
              },
            },
            {
              $project: {
                score: 1,
                jobTitle: { $ifNull: [{ $first: "$_job.title" }, ""] },
              },
            },
          ],
          recentAnalyses: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "jobprofiles",
                localField: "jobProfileId",
                foreignField: "_id",
                as: "_job",
              },
            },
            {
              $lookup: {
                from: "resumes",
                localField: "resumeId",
                foreignField: "_id",
                as: "_resume",
              },
            },
            {
              $project: {
                score: 1,
                createdAt: 1,
                jobTitle: { $ifNull: [{ $first: "$_job.title" }, ""] },
                resumeTitle: { $ifNull: [{ $first: "$_resume.title" }, ""] },
              },
            },
          ],
        },
      },
    ]),

    // ── 3. Roadmap stats ─────────────────────────────────────────────────────
    LearningRoadmap.aggregate([
      { $match: { userId } },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgProgress: { $avg: "$progress.percentage" },
                completed: {
                  $sum: {
                    $cond: [{ $eq: ["$progress.percentage", 100] }, 1, 0],
                  },
                },
                totalTasks: { $sum: "$progress.totalTasks" },
                completedTasks: { $sum: "$progress.completedTasks" },
              },
            },
          ],
          active: [
            {
              $match: {
                "progress.percentage": { $gt: 0, $lt: 100 },
              },
            },
            { $sort: { "progress.percentage": -1 } },
            { $limit: 3 },
            {
              $project: {
                title: 1,
                duration: 1,
                category: 1,
                "progress.percentage": 1,
                "progress.completedTasks": 1,
                "progress.totalTasks": 1,
              },
            },
          ],
        },
      },
    ]),
  ]);

  // ── Shape the response ─────────────────────────────────────────────────────

  // Resume
  const resumeCounts: Record<string, number> = {};
  (resumeStats[0]?.counts ?? []).forEach(
    ({ _id, count }: { _id: string; count: number }) => {
      resumeCounts[_id] = count;
    },
  );
  const totalResumes = Object.values(resumeCounts).reduce(
    (a: number, b: number) => a + b,
    0,
  );

  // Analysis overview
  const analysisOverview = analysisStats[0]?.overview?.[0] ?? {};
  const totalTechQ = analysisOverview.totalTechQuestions ?? 0;
  const totalBehavQ = analysisOverview.totalBehavQuestions ?? 0;
  const answeredTechQ = analysisOverview.answeredTechQuestions ?? 0;
  const answeredBehavQ = analysisOverview.answeredBehavQuestions ?? 0;

  // Roadmap overview
  const roadmapOverview = roadmapStats[0]?.overview?.[0] ?? {};

  return {
    resume: {
      total: totalResumes,
      completed: resumeCounts["completed"] ?? 0,
      processing:
        (resumeCounts["processing"] ?? 0) + (resumeCounts["pending"] ?? 0),
      failed: resumeCounts["failed"] ?? 0,
      latest: resumeStats[0]?.latest?.[0] ?? null,
      topSkills: resumeStats[0]?.topSkills ?? [],
    },

    analysis: {
      total: analysisOverview.total ?? 0,
      avgScore: Math.round(analysisOverview.avgScore ?? 0),
      bestScore: analysisOverview.bestScore ?? 0,
      strongMatches: analysisOverview.strongMatches ?? 0, // score >= 80
      topMatchedSkills: analysisStats[0]?.topMatchedSkills ?? [],
      topSkillGaps: analysisStats[0]?.topSkillGaps ?? [],
      bestAnalysis: analysisStats[0]?.bestAnalysis?.[0] ?? null,
      recentAnalyses: analysisStats[0]?.recentAnalyses ?? [],
      interviewQuestions: {
        total: totalTechQ + totalBehavQ,
        answered: answeredTechQ + answeredBehavQ,
        technical: { total: totalTechQ, answered: answeredTechQ },
        behavioral: { total: totalBehavQ, answered: answeredBehavQ },
      },
    },

    roadmap: {
      total: roadmapOverview.total ?? 0,
      completed: roadmapOverview.completed ?? 0,
      avgProgress: Math.round(roadmapOverview.avgProgress ?? 0),
      totalTasks: roadmapOverview.totalTasks ?? 0,
      completedTasks: roadmapOverview.completedTasks ?? 0,
      active: roadmapStats[0]?.active ?? [],
    },
  };
};

export const DashboardStatsService = { getUsersDashboardStats };
