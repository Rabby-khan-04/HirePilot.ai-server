import TUser from "../modules/user/user.inteface.js";

declare global {
  namespace Express {
    interface Request {
      user?: TUser;
    }
  }
}
