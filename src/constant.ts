import { CookieOptions } from "express";
import { config } from "./app/config/index.js";

export const ALLOWED_ORIGIN = [
  "http://localhost:3000",
  "http://localhost:5173",
];

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: "lax",
  path: "/",
};
