import { Request, Response, NextFunction } from "express";
import { Token } from "../utility/TokenUtils";
import { RequestExtendUser, UserInput, UserUpdateInput } from "../dto/User.dto";

export const authMiddleware = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ message: "Authorization header is missing" });
      return;
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Authorization token is missing" });
      return;
    }
    const user = await Token.verifyToken(token);
    if (
      user &&
      typeof user.id === "number" &&
      typeof user.email === "string" &&
      typeof user.username === "string" &&
      typeof user.admin === "number"
    ) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        admin: Boolean(user.admin),
      };
    }
    next();
  } catch (error) {
    next(error);
  }
};
