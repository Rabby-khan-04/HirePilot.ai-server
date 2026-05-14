import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { generateAnalysisValidationSchema } from "./aiAnalyses.validation.js";
import AiAnalysesController from "./aiAnalyses.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/generate")
  .post(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    validateRequest(generateAnalysisValidationSchema),
    AiAnalysesController.generateAnalysis,
  );

router
  .route("/")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    AiAnalysesController.getUserAnalyses,
  );

router
  .route("/:id")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    AiAnalysesController.getSingleAnalysis,
  );

export default router;
