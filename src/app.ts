import express, { Request, Response } from "express";
import cors from "cors";
import { ALLOWED_ORIGIN } from "./constant.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler.js";

const app = express();

// App middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGIN.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    credentials: true,
    maxAge: 600,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use(globalErrorHandler);

export default app;
