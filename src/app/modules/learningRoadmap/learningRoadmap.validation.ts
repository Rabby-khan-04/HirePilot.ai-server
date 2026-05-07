import { z } from "zod";

const taskValidationSchema = z.object({
  text: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Task text is required" };
      if (iss.code === "invalid_type")
        return { message: "Task text must be a string" };
      return { message: "Invalid task text" };
    },
  }),

  isCompleted: z.boolean().optional(),
});

const dayValidationSchema = z.object({
  day: z.number({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Day number is required" };
      if (iss.code === "invalid_type")
        return { message: "Day must be a number" };
      return { message: "Invalid day number" };
    },
  }),

  title: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Day title is required" };
      if (iss.code === "invalid_type")
        return { message: "Day title must be a string" };
      return { message: "Invalid day title" };
    },
  }),

  tasks: z.array(taskValidationSchema).default([]),
});

const roadmapValidationSchema = z.object({
  week: z.number({
    error: (iss) => {
      if (iss.input === undefined)
        return { message: "Week number is required" };
      if (iss.code === "invalid_type")
        return { message: "Week must be a number" };
      return { message: "Invalid week number" };
    },
  }),

  days: z.array(dayValidationSchema).default([]),
});

export const learningRoadmapValidationSchema = z.object({
  userId: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "User ID is required" };
      return { message: "User ID must be a string" };
    },
  }),

  analysisId: z.string({
    error: (iss) => {
      if (iss.input === undefined)
        return { message: "Analysis ID is required" };
      return { message: "Analysis ID must be a string" };
    },
  }),

  title: z.string({
    error: (iss) => {
      if (iss.input === undefined)
        return { message: "Roadmap title is required" };
      return { message: "Roadmap title must be a string" };
    },
  }),

  duration: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Duration is required" };
      return { message: "Duration must be a string" };
    },
  }),

  roadmap: z.array(roadmapValidationSchema).default([]),

  progress: z.object({
    totalTasks: z.number().default(0),

    completedTasks: z.number().default(0),

    percentage: z.number().default(0),
  }),
});
