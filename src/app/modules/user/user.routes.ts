import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { userValidationSchema } from "./user.validation.js";
import UserController from "./user.controller.js";

const router = Router();

/**
 * Registers a new user.
 * Validates request body using Zod schema before passing control to the controller.
 *
 * @route POST /users/register
 * @access Public
 */
router
  .route("/register")
  .post(validateRequest(userValidationSchema), UserController.createUser);

export default router;
