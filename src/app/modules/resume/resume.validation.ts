import { z } from "zod";

const experienceValidationSchema = z.object({
  company: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Company must be a string" };
        return { message: "Invalid company" };
      },
    })
    .optional(),

  role: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Role must be a string" };
        return { message: "Invalid role" };
      },
    })
    .optional(),

  description: z.array(z.string()).optional(),
});

const projectValidationSchema = z.object({
  name: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Project name must be a string" };
        return { message: "Invalid project name" };
      },
    })
    .optional(),

  description: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Project description must be a string" };
        return { message: "Invalid project description" };
      },
    })
    .optional(),

  techStack: z.array(z.string()).optional(),
});

export const resumeValidationSchema = z.object({
  userId: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "User ID is required" };
      return { message: "User ID must be a string" };
    },
  }),

  title: z.string({
    error: (iss) => {
      if (iss.input === undefined)
        return { message: "Resume title is required" };
      return { message: "Resume title must be a string" };
    },
  }),

  fileUrl: z
    .url({
      error: (iss) => {
        if (iss.code === "invalid_format" || iss.code === "invalid_type")
          return { message: "File URL must be a valid URL" };
        return { message: "Invalid File url" };
      },
    })
    .optional(),

  rawText: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Raw text is required" };
      return { message: "Raw text must be a string" };
    },
  }),

  parsedData: z.object({
    skills: z.array(z.string()).default([]),

    experience: z.array(experienceValidationSchema).default([]),

    projects: z.array(projectValidationSchema).default([]),
  }),

  isLatest: z.boolean().optional(),
});
