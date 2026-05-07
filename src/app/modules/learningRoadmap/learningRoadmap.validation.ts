import { z } from "zod";

export const generateRoadmapValidationSchema = z.object({
  analysisId: z
    .string({
      error: () => ({
        message: "Analysis ID is required",
      }),
    })
    .min(1, "analysisId cannot be empty")
    .regex(/^[a-fA-F0-9]{24}$/, "analysisId must be a valid MongoDB ObjectId"),
});
