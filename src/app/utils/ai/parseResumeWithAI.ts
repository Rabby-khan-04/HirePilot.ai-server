import { z } from "zod";
import { TParsedData } from "../../modules/resume/resume.interface.js";
import genAI from "./genAI.js";

// ── Zod schema ────────────────────────────────────────────────────────────────
// No .optional() — keeps types as string | null, matching TExperience/TProject
// exactOptionalPropertyTypes: true requires this
const experienceSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  description: z.array(z.string()),
});

const projectSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  techStack: z.array(z.string()),
});

const parsedDataSchema = z.object({
  skills: z.array(z.string()),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
});

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_PARSED_DATA: TParsedData = {
  skills: [],
  experience: [],
  projects: [],
};

const MAX_RETRIES = 5;
const TIMEOUT_MS = 60_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Main function ─────────────────────────────────────────────────────────────
const parseResumeWithAI = async (rawText: string): Promise<TParsedData> => {
  if (!rawText?.trim()) return EMPTY_PARSED_DATA;

  const trimmedText = rawText.slice(0, 8000);

  const prompt = `
You are a resume parser. Extract structured information from the resume text below.
Be thorough — extract all skills, every work experience, and every project you find.
For any field you cannot find, use null.

Resume text:
"""
${trimmedText}
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
          // ✅ Zod v4 native — no external package, actually works
          responseSchema: parsedDataSchema.toJSONSchema(),
          httpOptions: { timeout: TIMEOUT_MS },
        },
      });

      const raw = response.text ?? "{}";

      // ✅ Zod v4 .parse() validates and returns correctly typed TParsedData
      const parsed = parsedDataSchema.parse(JSON.parse(raw));

      return parsed;
    } catch (error) {
      lastError = error;
      console.error(`Gemini attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt < MAX_RETRIES) {
        await delay(2000 * attempt); // 2s, 4s, 8s, 16s
      }
    }
  }

  throw lastError;
};

export default parseResumeWithAI;
