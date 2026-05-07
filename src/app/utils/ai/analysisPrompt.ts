type TResumeExperience = {
  company?: string | null;
  role?: string | null;
  description?: string[];
};

export type TAnalysisPromptInput = {
  resumeSkills: string[];
  resumeExperience: TResumeExperience[];
  jobTitle: string;
  technicalSkills: string[];
  softSkills: string[];
  keywords: string[];
};

const buildAnalysisPromptInput = (input: TAnalysisPromptInput): string => {
  const experienceSummary = input.resumeExperience
    .filter((e) => e.role || e.company)
    .map((e) => {
      const parts: string[] = [];
      if (e.role) parts.push(`Role: ${e.role}`);
      if (e.company) parts.push(`Company: ${e.company}`);
      if (e.description?.length) {
        parts.push(`Summary: ${e.description.slice(0, 3).join(". ")}`);
      }
      return parts.join(" | ");
    })
    .slice(0, 5) // cap experience entries to avoid bloat
    .join("\n");

  return `
RESUME:
Skills: ${input.resumeSkills.join(", ") || "None listed"}
Experience:
${experienceSummary || "No experience listed"}

JOB REQUIREMENTS (Title: ${input.jobTitle}):
Technical Skills Required: ${input.technicalSkills.join(", ") || "None listed"}
Soft Skills Required: ${input.softSkills.join(", ") || "None listed"}
Keywords: ${input.keywords.join(", ") || "None listed"}
`.trim();
};

export default buildAnalysisPromptInput;
