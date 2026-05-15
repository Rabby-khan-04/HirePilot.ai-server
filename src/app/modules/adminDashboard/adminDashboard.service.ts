import User from "../user/user.model.js";
import Resume from "../resume/resume.model.js";
import AiAnalyses from "../aiAnalyses/aiAnalyses.model.js";
import LearningRoadmap from "../learningRoadmap/learningRoadmap.model.js";

// ── Helpers ────────────────────────────────────────────────────────────────

const getDateRange = (period: "week" | "month") => {
  const now = new Date();
  const past = new Date();

  if (period === "week") {
    past.setDate(now.getDate() - 7 * 12); // last 12 weeks
  } else {
    past.setMonth(now.getMonth() - 12); // last 12 months
  }

  return { start: past, end: now };
};

const getGroupFormat = (period: "week" | "month") => {
  if (period === "week") {
    return {
      year: { $isoWeekYear: "$createdAt" },
      week: { $isoWeek: "$createdAt" },
    };
  }
  return {
    year: { $year: "$createdAt" },
    month: { $month: "$createdAt" },
  };
};

const getLabelFormat = (period: "week" | "month") => {
  if (period === "week") {
    return {
      $concat: [
        "W",
        { $toString: { $isoWeek: "$createdAt" } },
        " ",
        { $toString: { $isoWeekYear: "$createdAt" } },
      ],
    };
  }
  return {
    $dateToString: { format: "%b %Y", date: "$createdAt" },
  };
};

// ── Overview Stats ─────────────────────────────────────────────────────────

const getOverviewStats = async () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now);
  startOfMonth.setMonth(now.getMonth() - 1);

  const [userStats, resumeStats, analysisStats, roadmapStats] =
    await Promise.all([
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            newThisWeek: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $count: "count" },
            ],
            newThisMonth: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $count: "count" },
            ],
            byRole: [
              {
                $group: {
                  _id: "$role",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),

      Resume.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            newThisWeek: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $count: "count" },
            ],
            newThisMonth: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $count: "count" },
            ],
            byStatus: [
              {
                $group: {
                  _id: "$processingStatus",
                  count: { $sum: 1 },
                },
              },
            ],
            avgScore: [
              { $match: { processingStatus: "completed", score: { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  avg: { $avg: "$score" },
                },
              },
            ],
          },
        },
      ]),

      AiAnalyses.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            newThisWeek: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $count: "count" },
            ],
            newThisMonth: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $count: "count" },
            ],
            avgScore: [
              {
                $group: {
                  _id: null,
                  avg: { $avg: "$score" },
                  highest: { $max: "$score" },
                  lowest: { $min: "$score" },
                },
              },
            ],
            scoreDistribution: [
              {
                $group: {
                  _id: null,
                  strong: {
                    $sum: { $cond: [{ $gte: ["$score", 80] }, 1, 0] },
                  },
                  moderate: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gte: ["$score", 60] },
                            { $lt: ["$score", 80] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  weak: {
                    $sum: { $cond: [{ $lt: ["$score", 60] }, 1, 0] },
                  },
                },
              },
            ],
          },
        },
      ]),

      LearningRoadmap.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            newThisWeek: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $count: "count" },
            ],
            newThisMonth: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $count: "count" },
            ],
            avgProgress: [
              {
                $group: {
                  _id: null,
                  avg: { $avg: "$progress.percentage" },
                  completed: {
                    $sum: {
                      $cond: [{ $eq: ["$progress.percentage", 100] }, 1, 0],
                    },
                  },
                },
              },
            ],
          },
        },
      ]),
    ]);

  // shape user role counts
  const roleMap: Record<string, number> = {};
  (userStats[0]?.byRole ?? []).forEach(
    ({ _id, count }: { _id: string; count: number }) => {
      roleMap[_id] = count;
    },
  );

  // shape resume status counts
  const statusMap: Record<string, number> = {};
  (resumeStats[0]?.byStatus ?? []).forEach(
    ({ _id, count }: { _id: string; count: number }) => {
      statusMap[_id] = count;
    },
  );

  return {
    users: {
      total: userStats[0]?.total?.[0]?.count ?? 0,
      newThisWeek: userStats[0]?.newThisWeek?.[0]?.count ?? 0,
      newThisMonth: userStats[0]?.newThisMonth?.[0]?.count ?? 0,
      admins: roleMap["admin"] ?? 0,
      regularUsers: roleMap["user"] ?? 0,
    },
    resumes: {
      total: resumeStats[0]?.total?.[0]?.count ?? 0,
      newThisWeek: resumeStats[0]?.newThisWeek?.[0]?.count ?? 0,
      newThisMonth: resumeStats[0]?.newThisMonth?.[0]?.count ?? 0,
      completed: statusMap["completed"] ?? 0,
      processing: statusMap["processing"] ?? 0,
      pending: statusMap["pending"] ?? 0,
      failed: statusMap["failed"] ?? 0,
      avgScore: Math.round(resumeStats[0]?.avgScore?.[0]?.avg ?? 0),
    },
    analyses: {
      total: analysisStats[0]?.total?.[0]?.count ?? 0,
      newThisWeek: analysisStats[0]?.newThisWeek?.[0]?.count ?? 0,
      newThisMonth: analysisStats[0]?.newThisMonth?.[0]?.count ?? 0,
      avgScore: Math.round(analysisStats[0]?.avgScore?.[0]?.avg ?? 0),
      highestScore: analysisStats[0]?.avgScore?.[0]?.highest ?? 0,
      lowestScore: analysisStats[0]?.avgScore?.[0]?.lowest ?? 0,
      scoreDistribution: analysisStats[0]?.scoreDistribution?.[0] ?? {
        strong: 0,
        moderate: 0,
        weak: 0,
      },
    },
    roadmaps: {
      total: roadmapStats[0]?.total?.[0]?.count ?? 0,
      newThisWeek: roadmapStats[0]?.newThisWeek?.[0]?.count ?? 0,
      newThisMonth: roadmapStats[0]?.newThisMonth?.[0]?.count ?? 0,
      avgProgress: Math.round(roadmapStats[0]?.avgProgress?.[0]?.avg ?? 0),
      completed: roadmapStats[0]?.avgProgress?.[0]?.completed ?? 0,
    },
  };
};

// ── Chart Data ─────────────────────────────────────────────────────────────

const getUserChartData = async (period: "week" | "month") => {
  const { start, end } = getDateRange(period);
  const groupFormat = getGroupFormat(period);
  const labelFormat = getLabelFormat(period);

  const data = await User.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: groupFormat,
        label: { $first: labelFormat },
        count: { $sum: 1 },
        users: {
          $push: {
            name: "$name",
            email: "$email",
            avatar: "$avatar",
            joinedAt: "$createdAt",
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        label: 1,
        count: 1,
        // only send first 5 users per bar for tooltip
        tooltipUsers: { $slice: ["$users", 5] },
      },
    },
  ]);

  return {
    period,
    total: data.reduce((sum, d) => sum + d.count, 0),
    chart: data,
  };
};

const getResumeChartData = async (period: "week" | "month") => {
  const { start, end } = getDateRange(period);
  const groupFormat = getGroupFormat(period);
  const labelFormat = getLabelFormat(period);

  const data = await Resume.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "_user",
      },
    },
    {
      $addFields: {
        userName: { $ifNull: [{ $first: "$_user.name" }, "Unknown"] },
        userEmail: { $ifNull: [{ $first: "$_user.email" }, ""] },
        userAvatar: { $ifNull: [{ $first: "$_user.avatar" }, null] },
      },
    },
    {
      $group: {
        _id: groupFormat,
        label: { $first: labelFormat },
        count: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$processingStatus", "completed"] }, 1, 0],
          },
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ["$processingStatus", "failed"] }, 1, 0],
          },
        },
        tooltipItems: {
          $push: {
            resumeTitle: "$title",
            userName: "$userName",
            userEmail: "$userEmail",
            userAvatar: "$userAvatar",
            status: "$processingStatus",
            score: "$score",
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        label: 1,
        count: 1,
        completed: 1,
        failed: 1,
        tooltipItems: { $slice: ["$tooltipItems", 5] },
      },
    },
  ]);

  return {
    period,
    total: data.reduce((sum, d) => sum + d.count, 0),
    chart: data,
  };
};

const getAnalysisChartData = async (period: "week" | "month") => {
  const { start, end } = getDateRange(period);
  const groupFormat = getGroupFormat(period);
  const labelFormat = getLabelFormat(period);

  const data = await AiAnalyses.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "_user",
      },
    },
    {
      $lookup: {
        from: "jobprofiles",
        localField: "jobProfileId",
        foreignField: "_id",
        as: "_job",
      },
    },
    {
      $addFields: {
        userName: { $ifNull: [{ $first: "$_user.name" }, "Unknown"] },
        userEmail: { $ifNull: [{ $first: "$_user.email" }, ""] },
        userAvatar: { $ifNull: [{ $first: "$_user.avatar" }, null] },
        jobTitle: { $ifNull: [{ $first: "$_job.title" }, "Unknown Role"] },
      },
    },
    {
      $group: {
        _id: groupFormat,
        label: { $first: labelFormat },
        count: { $sum: 1 },
        avgScore: { $avg: "$score" },
        strongMatches: {
          $sum: { $cond: [{ $gte: ["$score", 80] }, 1, 0] },
        },
        tooltipItems: {
          $push: {
            userName: "$userName",
            userEmail: "$userEmail",
            userAvatar: "$userAvatar",
            jobTitle: "$jobTitle",
            score: "$score",
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        label: 1,
        count: 1,
        avgScore: { $round: ["$avgScore", 1] },
        strongMatches: 1,
        tooltipItems: { $slice: ["$tooltipItems", 5] },
      },
    },
  ]);

  return {
    period,
    total: data.reduce((sum, d) => sum + d.count, 0),
    chart: data,
  };
};

const getRoadmapChartData = async (period: "week" | "month") => {
  const { start, end } = getDateRange(period);
  const groupFormat = getGroupFormat(period);
  const labelFormat = getLabelFormat(period);

  const data = await LearningRoadmap.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "_user",
      },
    },
    {
      $addFields: {
        userName: { $ifNull: [{ $first: "$_user.name" }, "Unknown"] },
        userEmail: { $ifNull: [{ $first: "$_user.email" }, ""] },
        userAvatar: { $ifNull: [{ $first: "$_user.avatar" }, null] },
      },
    },
    {
      $group: {
        _id: groupFormat,
        label: { $first: labelFormat },
        count: { $sum: 1 },
        avgProgress: { $avg: "$progress.percentage" },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$progress.percentage", 100] }, 1, 0],
          },
        },
        tooltipItems: {
          $push: {
            userName: "$userName",
            userEmail: "$userEmail",
            userAvatar: "$userAvatar",
            roadmapTitle: "$title",
            category: "$category",
            progress: "$progress.percentage",
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        label: 1,
        count: 1,
        avgProgress: { $round: ["$avgProgress", 1] },
        completed: 1,
        tooltipItems: { $slice: ["$tooltipItems", 5] },
      },
    },
  ]);

  return {
    period,
    total: data.reduce((sum, d) => sum + d.count, 0),
    chart: data,
  };
};

// ── Recent Activity ────────────────────────────────────────────────────────

const getRecentActivity = async () => {
  const [recentUsers, recentResumes, recentAnalyses, recentRoadmaps] =
    await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select("name email avatar role createdAt")
        .lean(),

      Resume.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("userId", "name email avatar")
        .select("title processingStatus score createdAt userId")
        .lean(),

      AiAnalyses.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("userId", "name email avatar")
        .populate("jobProfileId", "title")
        .select("score createdAt userId jobProfileId")
        .lean(),

      LearningRoadmap.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("userId", "name email avatar")
        .select("title category progress createdAt userId")
        .lean(),
    ]);

  return { recentUsers, recentResumes, recentAnalyses, recentRoadmaps };
};

// ── Platform Intelligence ──────────────────────────────────────────────────

const getPlatformIntelligence = async () => {
  const [topSkillGaps, topMatchedSkills, topJobProfiles, topCategories] =
    await Promise.all([
      // most common skill gaps platform-wide
      AiAnalyses.aggregate([
        { $unwind: "$skillGaps" },
        {
          $group: {
            _id: "$skillGaps.skill",
            count: { $sum: 1 },
            severity: { $max: "$skillGaps.severity" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { skill: "$_id", count: 1, severity: 1, _id: 0 } },
      ]),

      // most common matched skills platform-wide
      AiAnalyses.aggregate([
        { $unwind: "$matchedSkills" },
        {
          $group: {
            _id: "$matchedSkills",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { skill: "$_id", count: 1, _id: 0 } },
      ]),

      // most analyzed job profiles
      AiAnalyses.aggregate([
        {
          $lookup: {
            from: "jobprofiles",
            localField: "jobProfileId",
            foreignField: "_id",
            as: "_job",
          },
        },
        {
          $group: {
            _id: "$jobProfileId",
            title: { $first: { $first: "$_job.title" } },
            count: { $sum: 1 },
            avgScore: { $avg: "$score" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $project: {
            _id: 0,
            title: 1,
            count: 1,
            avgScore: { $round: ["$avgScore", 1] },
          },
        },
      ]),

      // most popular roadmap categories
      LearningRoadmap.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgProgress: { $avg: "$progress.percentage" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $project: {
            category: "$_id",
            count: 1,
            avgProgress: { $round: ["$avgProgress", 1] },
            _id: 0,
          },
        },
      ]),
    ]);

  return { topSkillGaps, topMatchedSkills, topJobProfiles, topCategories };
};

export const AdminDashboardService = {
  getOverviewStats,
  getUserChartData,
  getResumeChartData,
  getAnalysisChartData,
  getRoadmapChartData,
  getRecentActivity,
  getPlatformIntelligence,
};
