import { z } from "zod";

export const jobProfileValidationSchema = z.object({
  title: z.string({
    error: (iss) => {
      if (iss.input === undefined) {
        return { message: "Job title is required" };
      }
      return { message: "Job title must be a string" };
    },
  }),

  jobDescription: z
    .string({
      error: () => ({
        message: "Job description must be a string",
      }),
    })
    .optional(),
});
