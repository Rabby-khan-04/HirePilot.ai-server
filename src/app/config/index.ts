/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

function getEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const config = {
  port: getEnv(process.env.PORT, "PORT"),
  mongodb_uri: getEnv(process.env.MONGODB_URI, "MONGODB_URI"),
  node_env: getEnv(process.env.NODE_ENV, "NODE_ENV"),
  bcrypt_salt_round: getEnv(process.env.BCRYPT_SALT_ROUND, "BCRYPT_SALT_ROUND"),
  access_token_secret: getEnv(
    process.env.ACCESS_TOKEN_SECRET,
    "ACCESS_TOKEN_SECRET",
  ),
  access_token_expiry: getEnv(
    process.env.ACCESS_TOKEN_EXPIRY,
    "ACCESS_TOKEN_EXPIRY",
  ) as any,
  refresh_token_secret: getEnv(
    process.env.REFRESH_TOKEN_SECRET,
    "REFRESH_TOKEN_SECRET",
  ),
  refresh_token_expiry: getEnv(
    process.env.REFRESH_TOKEN_EXPIRY,
    "REFRESH_TOKEN_EXPIRY",
  ) as any,
};
