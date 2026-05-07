import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

function require(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const config = {
  port: require(process.env.PORT, "PORT"),
  mongodb_uri: require(process.env.MONGODB_URI, "MONGODB_URI"),
  node_env: require(process.env.NODE_ENV, "NODE_ENV"),
  bcrypt_salt_round: require(process.env
    .BCRYPT_SALT_ROUND, "BCRYPT_SALT_ROUND"),
};
