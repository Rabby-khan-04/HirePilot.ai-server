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
    validateRequest(jobProfileValidationSchema),
    JobProfileController.createJobProfile,
  )
  .get(AuthMiddleware.verifyJwt, JobProfileController.getAllJobProfiles);

router
  .route("/analysis")
  .get(AuthMiddleware.verifyJwt, JobProfileController.getJobAnalysis);

router
  .route("/:id")
  .get(AuthMiddleware.verifyJwt, JobProfileController.getSingleJobProfile);

export default router;
