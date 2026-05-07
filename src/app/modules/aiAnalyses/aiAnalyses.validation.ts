import { z } from "zod";

const skillGapValidationSchema = z.object({
  skill: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Skill is required" };
      if (iss.code === "invalid_type")
        return { message: "Skill must be a string" };
      return { message: "Invalid skill" };
    },
  }),

  severity: z.enum(["low", "medium", "high"], {
    error: (iss) => {
      if (iss.input === undefined) return { message: "Severity is required" };
      return { message: "Severity must be low, medium, or high" };
    },
  }),
});

const questionValidationSchema = z.object({
  question: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Question is required" };
      if (iss.code === "invalid_type")
        return { message: "Question must be a string" };
      return { message: "Invalid question" };
    },
  }),

  intention: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Intention is required" };
      if (iss.code === "invalid_type")
        return { message: "Intention must be a string" };
      return { message: "Invalid intention" };
    },
  }),

  answer: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Answer must be a string" };
        return { message: "Invalid answer" };
      },
    })
    .optional()
    .default(""),
});

export const aiAnalysesValidationSchema = z.object({
  userId: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "User ID is required" };
      return { message: "User ID must be a string" };
    },
  }),

  resumeId: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Resume ID is required" };
      return { message: "Resume ID must be a string" };
    },
  }),

  jobProfileId: z.string({
    error: (iss) => {
      if (iss.input === undefined)
        return { message: "Job profile ID is required" };
      return { message: "Job profile ID must be a string" };
    },
  }),

  score: z
    .number({
      error: (iss) => {
        if (iss.input === undefined) return { message: "Score is required" };
        return { message: "Score must be a number" };
      },
    })
    .min(0, { message: "Score cannot be less than 0" })
    .max(100, { message: "Score cannot be more than 100" }),

  matchedSkills: z.array(z.string()).default([]),

  skillGaps: z.array(skillGapValidationSchema).default([]),

  suggestions: z.array(z.string()).default([]),

  technicalQuestions: z.array(questionValidationSchema).default([]),

  behavioralQuestions: z.array(questionValidationSchema).default([]),
});
