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
    validateRequest(generateAnalysisValidationSchema),
    AiAnalysesController.generateAnalysis,
  );

router
  .route("/")
  .get(AuthMiddleware.verifyJwt, AiAnalysesController.getUserAnalyses);

router
  .route("/:id")
  .get(AuthMiddleware.verifyJwt, AiAnalysesController.getSingleAnalysis);

export default router;
