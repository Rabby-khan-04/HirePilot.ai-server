/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import genAI from "./genAI.js";
import buildAnalysisPromptInput, {
  TAnalysisPromptInput,
} from "./analysisPrompt.js";

// ─── Zod Schema (for response validation only) ─────────────────────────────────

const skillGapSchema = z.object({
  skill: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

const questionSchema = z.object({
  question: z.string(),
  intention: z.string(),
  answer: z.string(),
});

const analysisResultSchema = z.object({
  score: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  skillGaps: z.array(skillGapSchema).max(20),
  suggestions: z.array(z.string()).max(15),
  technicalQuestions: z.array(questionSchema).min(3).max(7),
  behavioralQuestions: z.array(questionSchema).min(3).max(5),
});

export type TAnalysisResult = z.infer<typeof analysisResultSchema>;

// ─── Plain JSON Schema for Gemini responseSchema ───────────────────────────────

const geminiResponseSchema = {
  type: "object",
  properties: {
    score: {
      type: "number",
      description:
        "Overall match score from 0 to 100 based on how well the resume matches the job requirements. Be realistic and precise.",
    },
    matchedSkills: {
      type: "array",
      items: { type: "string" },
      description:
        "List of skills that appear in both the resume and the job requirements. Include exact skill names only.",
    },
    skillGaps: {
      type: "array",
      maxItems: 20,
      description:
        "Skills required by the job that are missing or weak in the resume. Return at most 20 items, focusing on the most impactful gaps only.",
      items: {
        type: "object",
        properties: {
          skill: {
            type: "string",
            description:
              "Name of the missing or weak skill found in job requirements but not in resume.",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description:
              "Severity: 'high' if core requirement, 'medium' if important but not critical, 'low' if nice-to-have.",
          },
        },
        required: ["skill", "severity"],
      },
    },
    suggestions: {
      type: "array",
      maxItems: 15,
      description:
        "Actionable improvement suggestions for the candidate. Return at most 15 items. Be specific, practical, and prioritized — no generic advice.",
      items: { type: "string" },
    },
    technicalQuestions: {
      type: "array",
      minItems: 3,
      maxItems: 7,
      description:
        "Technical interview questions relevant to the job's required skills. Return between 3 and 7 questions.",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "A realistic technical interview question tailored to the job role and required skills.",
          },
          intention: {
            type: "string",
            description:
              "What the interviewer is assessing with this question (e.g., problem-solving depth, system design knowledge).",
          },
          answer: {
            type: "string",
            description:
              "A strong, concise model answer the candidate could use to respond effectively.",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      description:
        "Behavioral interview questions assessing soft skills and culture fit. Return between 3 and 5 questions.",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "A realistic behavioral interview question using STAR-method context.",
          },
          intention: {
            type: "string",
            description:
              "What the interviewer is trying to assess (e.g., teamwork, conflict resolution, leadership).",
          },
          answer: {
            type: "string",
            description:
              "A strong model answer demonstrating the desired behavior clearly and concisely.",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
  },
  required: [
    "score",
    "matchedSkills",
    "skillGaps",
    "suggestions",
    "technicalQuestions",
    "behavioralQuestions",
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);

// ─── Retry helper ──────────────────────────────────────────────────────────────

const callGeminiWithRetry = async (
  prompt: string,
  maxRetries = 5,
): Promise<TAnalysisResult> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiResponseSchema,
          httpOptions: { timeout: 60_000 },
        },
      });

      const text = response.text?.trim();

      if (!text) {
        throw new Error("Gemini returned an empty response");
      }

      // Strip markdown fences defensively
      const clean = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(clean);

      return analysisResultSchema.parse(parsed);
    } catch (err: any) {
      lastError = err;

      // Extract HTTP status from Gemini error shape
      const status: number | undefined = err?.status ?? err?.error?.code;
      const isRetryable =
        status !== undefined && RETRYABLE_STATUSES.has(status);

      // Do not retry non-recoverable errors (400 bad request, 401 auth, 404, etc.)
      if (!isRetryable) {
        console.error(
          `[Gemini] Non-retryable error (status=${status ?? "unknown"}):`,
          err?.message ?? err,
        );
        throw err;
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 2s → 4s → 8s → 16s
        const delay = 1000 * 2 ** attempt;
        console.warn(
          `[Gemini] ${status} on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`,
        );
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Gemini analysis failed after ${maxRetries} attempts: ${String(lastError)}`,
  );
};

// ─── Main export ───────────────────────────────────────────────────────────────

const generateAnalysis = async (
  input: TAnalysisPromptInput,
): Promise<TAnalysisResult> => {
  const contextBlock = buildAnalysisPromptInput(input);

  const prompt = `
You are an expert technical recruiter and career coach.

Analyze the resume against the job requirements below and return a structured JSON evaluation.

${contextBlock}

RULES:
- Return ONLY valid JSON matching the schema exactly.
- Do NOT include markdown, backticks, or explanation text.
- Be realistic with the score — do not inflate or deflate.
- Only include skill gaps that are genuinely missing from the resume.
- Keep suggestions specific and actionable, not generic advice.
- Tailor interview questions to the actual job title and required skills above.
`.trim();

  return await callGeminiWithRetry(prompt);
};

export default generateAnalysis;
