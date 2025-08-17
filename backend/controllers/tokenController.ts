import { Request, Response, NextFunction } from "express";
import { Token } from "../utility";
import { User } from "../models";

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || typeof authHeader !== "string") {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }
    const refreshToken = authHeader.split(" ")[1];
    console.log(refreshToken);
    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    // Assuming you have a Token utility to handle token operations
    const newToken = await Token.verifyRefreshToken(refreshToken);
    if (!newToken) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    console.log("New token:", newToken);

    // Generate a new access token
    const findedUser = await User.findOne(newToken.id);
    if (!findedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const newAccessToken = Token.generateToken({
      id: findedUser.id,
      email: findedUser.email,
      avatar: findedUser.avatar,
      cover: findedUser.cover,
      username: findedUser.username,
      admin: findedUser.admin,
      type: findedUser.type,
    });

    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    next(error);
  }
};
