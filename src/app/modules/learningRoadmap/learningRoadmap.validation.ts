import { z } from "zod";

export const learningRoadmapValidationSchema = z.object({
  analysisId: z.string({
    error: () => ({
      message: "Analysis ID is required",
    }),
  }),
});
