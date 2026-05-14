import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { jobProfileValidationSchema } from "./jobProfile.validation.js";
import JobProfileController from "./jobProfile.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    validateRequest(jobProfileValidationSchema),
    JobProfileController.createJobProfile,
  )
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    JobProfileController.getAllJobProfiles,
  );

router
  .route("/analysis")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    JobProfileController.getJobAnalysis,
  );

router
  .route("/:id")
  .get(
    AuthMiddleware.verifyJwt,
    AuthMiddleware.allowedRole("user"),
    JobProfileController.getSingleJobProfile,
  );

export default router;
