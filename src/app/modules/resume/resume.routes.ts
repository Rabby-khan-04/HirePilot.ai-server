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
    AuthMiddleware.allowedRole("user"),
    validateRequest(resumeValidationSchema),
    ResumeController.createResume,
  );

router
  .route("/:resumeId/retry-parsing")
  .post(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    ResumeController.retryParsing,
  );

router
  .route("/:resumeId")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    ResumeController.getAResume,
  );

router
  .route("/")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    ResumeController.getAllResume,
  );

export default router;
