import express from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import { AdminDashboardController } from "./adminDashboard.controller.js";

const router = express.Router();

// all routes require admin
router.use(AuthMiddleware.verifyJwt, AuthMiddleware.allowedRole("admin"));

router.get("/overview", AdminDashboardController.getOverviewStats);
router.get("/charts/users", AdminDashboardController.getUserChartData);
router.get("/charts/resumes", AdminDashboardController.getResumeChartData);
router.get("/charts/analyses", AdminDashboardController.getAnalysisChartData);
router.get("/charts/roadmaps", AdminDashboardController.getRoadmapChartData);
router.get("/recent-activity", AdminDashboardController.getRecentActivity);
router.get("/intelligence", AdminDashboardController.getPlatformIntelligence);

export default router;
