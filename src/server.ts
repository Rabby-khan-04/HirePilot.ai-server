/* eslint-disable no-console */
import mongoose from "mongoose";
import app from "./app.js";
import { config } from "./app/config/index.js";

const port = config.port;

async function main() {
  const instance = await mongoose.connect(config.mongodb_uri);

  console.log(
    `Database Connected Successfully!! HOST: ${instance.connection.host}`,
  );

  app.listen(port, () => {
    console.log(`SERVER is Running on PORT: ${port}`);
  });
}

main().catch((err) => {
  console.error(`Fatal startup error:`, err);
  process.exit(1);
});
