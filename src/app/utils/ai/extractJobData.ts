import { z } from "zod";
import { TExtractedData } from "../../modules/jobProfile/jobProfile.interface.js";
import genAI from "./genAI.js";

const extractedDataSchema = z.object({
  technicalSkills: z.array(z.string()).max(25),
  softSkills: z.array(z.string()).max(8),
  experienceLevel: z.string().nullable(),
  keywords: z.array(z.string()).max(8),
});

const EMPTY_EXTRACTED_DATA: TExtractedData = {
  technicalSkills: [],
  softSkills: [],
  experienceLevel: null,
  keywords: [],
};

const MAX_RETRIES = 5;
const TIMEOUT_MS = 60_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractJobData = async (
  jobDescription: string,
): Promise<TExtractedData> => {
  if (!jobDescription?.trim()) return EMPTY_EXTRACTED_DATA;

  const trimmedDesc = jobDescription.slice(0, 8000);

  const prompt = `
You are a job description analyzer. Extract structured data from the job description below.

STRICT LIMITS — you must not exceed these:
- technicalSkills: at most 25 items — pick only the most important and distinct technical skills
- softSkills: at most 8 items — pick only the most prominent soft skills
- keywords: exactly 8 items — the 8 most relevant and searchable keywords that best represent this role
- experienceLevel: a single string like "Junior", "Mid-level", "Senior", or null if unclear

Rules:
- Avoid duplicates or near-duplicates (e.g. don't include both "React" and "ReactJS")
- Prefer specific over generic (e.g. "PostgreSQL" over "databases")
- For any field you cannot find, use null for strings and empty array for arrays

Job Description:
"""
${trimmedDesc}
"""
`.trim();

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: extractedDataSchema.toJSONSchema(),
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });

      const raw = response.text ?? "{}";
      const parsed = extractedDataSchema.parse(JSON.parse(raw));

      return {
        technicalSkills: parsed.technicalSkills.slice(0, 25),
        softSkills: parsed.softSkills.slice(0, 8),
        experienceLevel: parsed.experienceLevel ?? null,
        keywords: parsed.keywords.slice(0, 8),
      };
    } catch (error) {
      lastError = error;
      console.error(
        `extractJobData attempt ${attempt}/${MAX_RETRIES} failed:`,
        error,
      );
      if (attempt < MAX_RETRIES) {
        await delay(2000 * attempt);
      }
    }
  }

  throw lastError;
};

export default extractJobData;
