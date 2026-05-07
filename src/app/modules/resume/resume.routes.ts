import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { resumeValidationSchema } from "./resume.validation.js";
import ResumeController from "./resume.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/resume")
  .post(
    AuthMiddleware.verifyJwt,
    validateRequest(resumeValidationSchema),
    ResumeController.createResume,
  );

router
  .route("/resume/:resumeId/retry-parsing")
  .post(AuthMiddleware.verifyJwt, ResumeController.retryParsing);

export default router;
