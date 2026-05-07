export const ALLOWED_ORIGIN = [
  "http://localhost:3000",
  "http://localhost:5173",
];

export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};
