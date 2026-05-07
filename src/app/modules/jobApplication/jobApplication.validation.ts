import { z } from "zod";

export const jobApplicationValidationSchema = z.object({
  userId: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "User ID is required" };
      return { message: "User ID must be a string" };
    },
  }),

  companyName: z.string({
    error: (iss) => {
      if (iss.input === undefined)
        return { message: "Company name is required" };
      return { message: "Company name must be a string" };
    },
  }),

  roleTitle: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Role title is required" };
      return { message: "Role title must be a string" };
    },
  }),

  jobUrl: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Job URL must be a string" };
        return { message: "Invalid Job URL" };
      },
    })
    .url({ message: "Job URL must be a valid URL" })
    .optional()
    .nullable(),

  location: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Location must be a string" };
        return { message: "Invalid location" };
      },
    })
    .optional()
    .nullable(),

  status: z
    .enum(["saved", "applied", "interview", "offer", "rejected"], {
      error: (iss) => {
        if (iss.input === undefined) return { message: "Status is required" };
        return { message: "Invalid application status" };
      },
    })
    .default("saved"),

  appliedDate: z
    .date({
      error: (iss) => {
        if (iss.input === undefined)
          return { message: "Applied date is required" };
        if (iss.code === "invalid_type")
          return { message: "Applied date must be a valid date" };
        return { message: "Invalid applied date" };
      },
    })
    .optional()
    .nullable(),

  notes: z
    .string({
      error: (iss) => {
        if (iss.code === "invalid_type")
          return { message: "Notes must be a string" };
        return { message: "Invalid notes" };
      },
    })
    .optional()
    .default(""),
});
