import { z } from "zod";

export const userValidationSchema = z.object({
  name: z.string({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Name is required" };
      if (iss.code === "invalid_type")
        return { message: "Name must be a string" };
      return { message: "Invalid name" };
    },
  }),

  email: z.email({
    error: (iss) => {
      if (iss.input === undefined) return { message: "Email is required" };
      return { message: "Invalid email format" };
    },
  }),

  password: z
    .string({
      error: (iss) => {
        if (iss.input === undefined) return { message: "Password is required" };
        if (iss.code === "invalid_type")
          return { message: "Password must be a string" };
        return { message: "Invalid password" };
      },
    })
    .min(6, { message: "Password must be at least 6 characters long" }),

  role: z
    .enum(["user", "admin"], {
      error: (iss) => {
        if (iss.input === undefined) return { message: "Role is required" };
        return { message: "Role must be either user or admin" };
      },
    })
    .optional(),

  avatar: z
    .url({
      error: (iss) => {
        if (iss.code === "invalid_format" || iss.code === "invalid_type")
          return { message: "Avatar must be a valid URL" };
        return { message: "Invalid avatar url" };
      },
    })
    .optional(),
  refreshToken: z.string().optional(),
});
