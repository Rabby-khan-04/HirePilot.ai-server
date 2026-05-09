import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { userValidationSchema } from "./user.validation.js";
import UserController from "./user.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * Registers a new user.
 * Validates request body using Zod schema before passing control to the controller.
 *
 * @route POST /users/user/register
 * @access Public
 */
router
  .route("/user/register")
  .post(validateRequest(userValidationSchema), UserController.createUser);

/**
 * Login a user.
 * Validates user password and issue token
 *
 * @route POST /users/user/login
 * @access Public
 */
router.route("/user/login").post(UserController.loginUser);

router
  .route("/user")
  .get(AuthMiddleware.verifyJwt, UserController.getAUserInfo);

router.route("/user/refresh-token").post(UserController.refreshAccessToken);

router.route("/user/logout").post(UserController.logoutUser);

export default router;
