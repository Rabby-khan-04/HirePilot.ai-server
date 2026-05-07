import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { resumeValidationSchema } from "./resume.validation.js";
import ResumeController from "./resume.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(
    AuthMiddleware.verifyJwt,
    validateRequest(resumeValidationSchema),
    ResumeController.createResume,
  );

router
  .route("/:resumeId/retry-parsing")
  .post(AuthMiddleware.verifyJwt, ResumeController.retryParsing);

router
  .route("/:resumeId")
  .get(AuthMiddleware.verifyJwt, ResumeController.getAResume);

export default router;
