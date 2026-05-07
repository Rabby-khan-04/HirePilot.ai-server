import { CookieOptions } from "express";

export const ALLOWED_ORIGIN = [
  "http://localhost:3000",
  "http://localhost:5173",
];

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
};
