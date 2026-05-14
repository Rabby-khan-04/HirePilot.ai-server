// dashboardStats.route.ts
import express from "express";
import { DashboardStatsController } from "./dashboardStats.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/user/stats",
  AuthMiddleware.verifyJwt,
  AuthMiddleware.allowedRole("user"),
  DashboardStatsController.getUsersDashboardStats,
);

export default router;
