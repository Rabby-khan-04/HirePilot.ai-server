import genAI from "./genAI.js";

const generateJobDescription = async (jobTitle: string): Promise<string> => {
  const prompt = `
You are a professional job description writer.
Write a realistic, detailed job description for the following job title:
"${jobTitle}"

Include:
- Role overview (2–3 sentences)
- Key responsibilities (6–8 bullet points)
- Required technical skills (keep it focused, list only the most essential — no more than 12)
- Required soft skills (3–5 only)
- Experience level required
- Nice to have skills (3–5 only)

Write it as a real job post from a tech company. Be specific and professional.
Return ONLY the job description text — no extra explanation, no headings like "Here is your job description".
`.trim();

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      httpOptions: { timeout: 60_000 },
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("AI returned empty job description");
  }

  return text;
};

export default generateJobDescription;
