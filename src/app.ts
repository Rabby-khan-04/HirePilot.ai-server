import express, { Request, Response } from "express";
import cors from "cors";
import { ALLOWED_ORIGIN } from "./constant.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler.js";
import cookieParser from "cookie-parser";

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
app.use(express.static("public"));
app.use(cookieParser());

// Router Import
import userRouter from "./app/modules/user/user.routes.js";
import resumeRouter from "./app/modules/resume/resume.routes.js";
import jobProfileRoute from "./app/modules/jobProfile/jobProfile.routes.js";
import aiAnalysesRoute from "./app/modules/aiAnalyses/aiAnalyses.routes.js";
import learningRoadmapsRoute from "./app/modules/learningRoadmap/learningRoadmap.routes.js";
import dashboardStatsRoute from "./app/modules/dashboardStats/dashboardStats.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/resumes", resumeRouter);
app.use("/api/v1/job-profiles", jobProfileRoute);
app.use("/api/v1/ai-analyses", aiAnalysesRoute);
app.use("/api/v1/learning-roadmaps", learningRoadmapsRoute);
app.use("/api/v1/dashboard", dashboardStatsRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use(globalErrorHandler);

export default app;
