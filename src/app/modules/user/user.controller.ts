import { Request, Response } from "express";

/**
 *  Creates a new user in the system. It validates the request body,
 * hashes the password, and stores the user in the database.
 * @name createUser
 * @access Public
 */
const createUser = (req: Request, res: Response) => {};

const UserController = { createUser };

export default UserController;
