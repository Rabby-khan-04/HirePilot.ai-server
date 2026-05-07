import jwt from "jsonwebtoken";

const verifyJwtToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

export default verifyJwtToken;
