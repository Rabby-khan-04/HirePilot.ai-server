import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { generateRoadmapValidationSchema } from "./learningRoadmap.validation.js";
import LearningRoadmapController from "./learningRoadmap.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /learning-roadmaps/generate
router
  .route("/generate")
  .post(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    validateRequest(generateRoadmapValidationSchema),
    LearningRoadmapController.generateRoadmap,
  );

// GET /learning-roadmaps
router
  .route("/")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    LearningRoadmapController.getUserRoadmaps,
  );

// GET /learning-roadmaps/:roadmapId
router
  .route("/:roadmapId")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    LearningRoadmapController.getSingleRoadmap,
  )
  .delete(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    LearningRoadmapController.deleteRoadmap,
  );

// PATCH /learning-roadmaps/:roadmapId/tasks/:taskId/toggle
router
  .route("/:roadmapId/tasks/:taskId/toggle")
  .patch(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    LearningRoadmapController.toggleTaskCompletion,
  );

export default router;
