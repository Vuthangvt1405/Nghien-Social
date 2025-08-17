import { Request, Response, NextFunction } from "express";
import { Token } from "../utility";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      const check = await Token.verifyToken(token);
      if (!check || !check.admin) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      } else {
        next();
      }
    }
  } catch (error) {
    console.error("Verified admin errror:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};
