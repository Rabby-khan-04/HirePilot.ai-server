import { z } from "zod";

export const aiAnalysesValidationSchema = z.object({
  resumeId: z.string({
    error: () => ({ message: "Resume ID is required" }),
  }),

  jobProfileId: z.string({
    error: () => ({ message: "Job profile ID is required" }),
  }),
});
