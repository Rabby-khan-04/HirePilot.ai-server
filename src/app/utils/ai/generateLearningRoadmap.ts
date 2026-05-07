/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import genAI from "./genAI.js";

// ─── Zod Schema (response validation) ─────────────────────────────────────────

const taskResultSchema = z.object({
  text: z.string(),
  resource: z.string().optional().default(""),
});

const dayResultSchema = z.object({
  day: z.number(),
  title: z.string(),
  tasks: z.array(taskResultSchema),
});

const weekResultSchema = z.object({
  week: z.number(),
  focus: z.string(),
  days: z.array(dayResultSchema),
});

const roadmapResultSchema = z.object({
  title: z.string(),
  duration: z.string(),
  roadmap: z.array(weekResultSchema).min(1).max(4),
});

export type TRoadmapResult = z.infer<typeof roadmapResultSchema>;

// ─── Gemini JSON Schema ────────────────────────────────────────────────────────

const geminiResponseSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "A clear, motivating title for this learning roadmap",
    },
    duration: {
      type: "string",
      description: 'Total duration, e.g. "2 Weeks" or "4 Weeks"',
    },
    roadmap: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      description: "Week-by-week learning plan, maximum 4 weeks",
      items: {
        type: "object",
        properties: {
          week: { type: "number", description: "Week number starting from 1" },
          focus: {
            type: "string",
            description: "The main learning theme or focus for this week",
          },
          days: {
            type: "array",
            description: "Day-by-day breakdown for this week (5–7 days)",
            items: {
              type: "object",
              properties: {
                day: { type: "number", description: "Day number" },
                title: {
                  type: "string",
                  description: "Short title for this day's learning focus",
                },
                tasks: {
                  type: "array",
                  description: "2–4 concrete tasks for the day",
                  items: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "A specific, actionable learning task description",
                      },
                      resource: {
                        type: "string",
                        description:
                          "A helpful URL or resource name (optional but recommended)",
                      },
                    },
                    required: ["text"],
                  },
                },
              },
              required: ["day", "title", "tasks"],
            },
          },
        },
        required: ["week", "focus", "days"],
      },
    },
  },
  required: ["title", "duration", "roadmap"],
};

// ─── Input type ────────────────────────────────────────────────────────────────

export type TRoadmapPromptInput = {
  score: number;
  skillGaps: { skill: string; severity: "low" | "medium" | "high" }[];
  suggestions: string[];
  matchedSkills: string[];
};

// ─── Prompt builder ────────────────────────────────────────────────────────────

const buildRoadmapPrompt = (input: TRoadmapPromptInput): string => {
  const skillGapLines = input.skillGaps
    .map((g) => `  - ${g.skill} (severity: ${g.severity})`)
    .join("\n");

  return `
You are an expert career coach and technical educator.

A job applicant has the following profile from their AI-powered resume vs job analysis:

CURRENT MATCH SCORE: ${input.score}/100

MATCHED SKILLS (already known):
${input.matchedSkills.length ? input.matchedSkills.map((s) => `  - ${s}`).join("\n") : "  None"}

SKILL GAPS (needs to learn):
${skillGapLines || "  None identified"}

IMPROVEMENT SUGGESTIONS:
${input.suggestions.length ? input.suggestions.map((s) => `  - ${s}`).join("\n") : "  None"}

TASK:
Generate a personalized, week-by-week learning roadmap to help this candidate close their skill gaps and improve their job readiness.

RULES:
- Return ONLY valid JSON. No markdown. No backticks. No explanations.
- Generate between 2 and 4 weeks based on the number and severity of skill gaps.
- Each week should have 5 to 7 days.
- Each day should have 2 to 4 specific, beginner-friendly tasks.
- Include real resource URLs (MDN, official docs, freeCodeCamp, Roadmap.sh, YouTube, etc.) where possible.
- Tasks must be concrete and actionable, not vague.
- Prioritize high-severity skill gaps first.
- Build progressively — foundational concepts before advanced ones.
`.trim();
};

// ─── Retry helper ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);

const callGeminiWithRetry = async (
  prompt: string,
  maxRetries = 5,
): Promise<TRoadmapResult> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiResponseSchema,
          httpOptions: { timeout: 90_000 },
        },
      });

      const text = response.text?.trim();
      if (!text) throw new Error("Gemini returned an empty response");

      // Strip any accidental markdown fences
      const clean = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(clean);

      return roadmapResultSchema.parse(parsed);
    } catch (err: any) {
      lastError = err;

      const httpStatus: number | undefined = err?.status ?? err?.error?.code;
      const isRetryable =
        httpStatus !== undefined && RETRYABLE_STATUSES.has(httpStatus);

      if (!isRetryable) {
        console.error(
          `[Gemini Roadmap] Non-retryable error (status=${httpStatus ?? "unknown"}):`,
          err?.message ?? err,
        );
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = 1000 * 2 ** attempt;
        console.warn(
          `[Gemini Roadmap] ${httpStatus} on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`,
        );
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Gemini roadmap generation failed after ${maxRetries} attempts: ${String(lastError)}`,
  );
};

// ─── Main export ───────────────────────────────────────────────────────────────

const generateLearningRoadmap = async (
  input: TRoadmapPromptInput,
): Promise<TRoadmapResult> => {
  const prompt = buildRoadmapPrompt(input);
  return await callGeminiWithRetry(prompt);
};

export default generateLearningRoadmap;
