import {
  TProgress,
  TWeek,
} from "../modules/learningRoadmap/learningRoadmap.interface.js";

/**
 * Calculates roadmap progress by counting total and completed tasks
 * across all weeks and days.
 */
const calculateRoadmapProgress = (roadmap: TWeek[]): TProgress => {
  let totalTasks = 0;
  let completedTasks = 0;

  for (const week of roadmap) {
    for (const day of week.days) {
      for (const task of day.tasks) {
        totalTasks++;
        if (task.isCompleted) completedTasks++;
      }
    }
  }

  const percentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return { totalTasks, completedTasks, percentage };
};

export default calculateRoadmapProgress;
