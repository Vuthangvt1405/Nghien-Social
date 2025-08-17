import { Request, Response, NextFunction } from "express";
import { User } from "../../models";

export const setAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Assuming you have a User model with a method to set admin status
    const user = await User.findOne(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await user.toggleSetAdmin();

    res.status(200).json({ message: "set admin status successfull", user });
  } catch (error) {
    next(error);
  }
};
