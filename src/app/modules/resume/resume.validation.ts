import { z } from "zod";

export const resumeValidationSchema = z.object({
  // title: z.string({
  //   error: (iss) => {
  //     if (iss.input === undefined) {
  //       return { message: "Resume title is required" };
  //     }

  //     return { message: "Resume title must be a string" };
  //   },
  // }),

  fileUrl: z.url({
    error: (iss) => {
      if (iss.code === "invalid_format" || iss.code === "invalid_type") {
        return { message: "File URL must be valid" };
      }

      return { message: "Invalid file URL" };
    },
  }),
});
