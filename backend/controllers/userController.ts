import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { PasswordUtils } from "../utility";
import { Token } from "../utility/TokenUtils";
import { RequestExtendUser, UserInput, userResponse } from "../dto";
import multer from "multer";
import FormData from "form-data";
import type FormDataType from "form-data";
import fetch from "node-fetch";
import { userInfo } from "os";
import { UserVerification } from "../models/UserVerification";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = <UserInput>req.body;

    if (!username || !email || !password) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    //if user already exists, return an error
    const existingUser = await User.findOne(undefined, email);

    if (existingUser) {
      res.status(409).json({
        message: "User already exists",
      });
      return;
    }

    //hash the password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    const user = await User.create(username, email, hashedPassword, "basic");

    res.status(201).json({
      message: "User created successfully",
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne(undefined, email);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await PasswordUtils.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const userResponse = {
      ...user,
      token: Token.generateToken({
        id: user.id,
        email: user.email,
        avatar: user.avatar,
        cover: user.cover,
        username: user.username,
        description: user.description,
        admin: user.admin,
        type: user.type,
      }),
      refreshToken: Token.generateRefreshToken({
        id: user.id,
      }),
    };

    res.status(200).json({ message: "Login successful", user: userResponse });
  } catch (error) {
    next(error);
  }
};

export async function loginUserGoogle(
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({ message: "Google token is required" });
      return;
    }
    const user = await Token.verifyGoogleToken(token);
    //find if user already exist
    console.log(user);
    const existingUser = await User.findOne(undefined, user.email);
    if (existingUser) {
      res.status(200).json({
        ...user,
        token: Token.generateToken({
          id: existingUser.id,
          email: user.email,
          avatar: user.avatar,
          cover: user.cover,
          username: user.username,
          description: user.description,
          admin: user.admin,
          type: user.type,
        }),
        refreshToken: Token.generateRefreshToken({
          id: user.id,
        }),
      });
      return;
    }

    //set default password if user login google
    user.password = await PasswordUtils.hashPassword(
      process.env.GOOGLE_USER_PASSWORD_DEFAULT as string
    );

    //if user does not exist
    const createdUser = await User.create(
      user.username,
      user.email,
      user.password,
      "google",
      user.avatar,
      user.cover
    );

    const userResponse = {
      ...createdUser,
      token: Token.generateToken({
        id: createdUser.id,
        email: createdUser.email,
        avatar: createdUser.avatar,
        cover: createdUser.cover,
        username: createdUser.username,
        admin: createdUser.admin,
        type: "google",
      }),
      refreshToken: Token.generateRefreshToken({
        id: createdUser.id,
      }),
    };

    res.status(200).json({ message: "Login successful", user: userResponse });
  } catch (error) {
    next(error);
  }
}

export const updateUser = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.user?.id;

    const { username, password, avatar, cover, description } = <UserInput>(
      req.body
    );

    if (id !== req.user?.id) {
      res
        .status(403)
        .json({ message: "You are not authorized to update this user" });
      return;
    }

    const user = await User.findOne(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username) user.username = username || user.username;
    if (password) user.password = await PasswordUtils.hashPassword(password);
    if (avatar) user.avatar = avatar || user.avatar;
    if (cover) user.cover = cover || user.cover;
    if (description) user.description = description || user.description;

    await user.save();

    const token = Token.generateToken({
      id: user.id,
      email: user.email,
      avatar: user.avatar,
      cover: user.cover,
      username: user.username,
      description: user.description,
      admin: user.admin,
      type: user.type,
    });

    res.status(200).json({
      message: "User updated successfully",
      user: {
        ...user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      limits: {
        fileSize: 128 * 1024 * 1024, // 128MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Only image files are allowed"));
        }
      },
    }).single("source");

    upload(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer error:", err);
        return res
          .status(500)
          .json({ message: "Upload error", error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("✅ Image received:");
      console.log("Filename:", req.file.originalname);
      console.log("MIME Type:", req.file.mimetype);
      console.log("Size:", req.file.size, "bytes");

      const uploadFreeHost = process.env.UPLOAD_FREE_HOST_URL;
      const apiKeyFreeHost = process.env.UPLOAD_FREE_HOST_API_KEY;

      if (!uploadFreeHost || !apiKeyFreeHost) {
        return res.status(500).json({
          message: "Upload host or API key not configured",
        });
      }

      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString("base64");

        const formData: FormDataType = new FormData();
        formData.append("key", apiKeyFreeHost);
        formData.append("action", "upload");
        formData.append("format", "json");
        formData.append("source", base64Image); // Send as base64 data URI

        console.log("Uploading to:", uploadFreeHost);
        console.log("Using API key:", apiKeyFreeHost.substring(0, 8) + "...");
        try {
          const response = await fetch(uploadFreeHost, {
            method: "POST",
            body: formData as any,
            headers: {
              ...formData.getHeaders(),
              Connection: "close",
            },
          });

          // Log response details for debugging
          const responseText = await response.text();
          console.log("Response status:", response.status);
          console.log("Response body:", responseText);

          if (!response.ok) {
            // Try to parse error details from freeimage.host
            try {
              const errorInfo = JSON.parse(responseText);
              throw new Error(
                `External service error: ${response.status} - ${
                  errorInfo.error?.message ||
                  errorInfo.status_txt ||
                  response.statusText
                }`
              );
            } catch (parseError) {
              throw new Error(
                `External service error: ${response.status} ${response.statusText} - ${responseText}`
              );
            }
          }

          const data = JSON.parse(responseText);
          console.log("✅ Image uploaded to external service successfully");

          // You can access the uploaded image URL from the response
          const imageUrl = data.image?.url;
          //store avatar in the user profile
          if (req.user?.id && imageUrl) {
            const user = await User.findOne(req.user.id);
            if (user) {
              user.avatar = imageUrl;
              await user.save();
              res.status(200).json({
                message: "Image uploaded successfully",
                payload: {
                  ...user,
                  token: Token.generateToken({
                    id: user.id,
                    email: user.email,
                    avatar: user.avatar,
                    cover: user.cover,
                    username: user.username,
                    description: user.description,
                    admin: user.admin,
                    type: user.type,
                  }),
                },
              });
            } else {
              console.warn("User not found");
              res.status(404).json({ message: "User not found" });
            }
          } else {
            console.warn("User not found or image URL is missing");
            return res.status(400).json({
              message: "User not found or image URL is missing",
            });
          }
        } catch (fetchError) {
          console.error("❌ Fetch error:", fetchError);
          res.status(500).json({
            message: "Failed to upload to external service",
            error:
              fetchError instanceof Error
                ? fetchError.message
                : "Unknown error",
          });
        }
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    console.error("❌ Error in uploadAvatar:", error);
    res.status(500).json({
      message: "Error uploading avatar",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const uploadCover = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      limits: {
        fileSize: 128 * 1024 * 1024, // 128MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Only image files are allowed"));
        }
      },
    }).single("source");

    upload(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer error:", err);
        return res
          .status(500)
          .json({ message: "Upload error", error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("✅ Image received:");
      console.log("Filename:", req.file.originalname);
      console.log("MIME Type:", req.file.mimetype);
      console.log("Size:", req.file.size, "bytes");

      const uploadFreeHost = process.env.UPLOAD_FREE_HOST_URL;
      const apiKeyFreeHost = process.env.UPLOAD_FREE_HOST_API_KEY;

      if (!uploadFreeHost || !apiKeyFreeHost) {
        return res.status(500).json({
          message: "Upload host or API key not configured",
        });
      }

      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString("base64");

        const formData: FormDataType = new FormData();
        formData.append("key", apiKeyFreeHost);
        formData.append("action", "upload");
        formData.append("format", "json");
        formData.append("source", base64Image); // Send as base64 data URI

        console.log("Uploading to:", uploadFreeHost);
        console.log("Using API key:", apiKeyFreeHost.substring(0, 8) + "...");
        try {
          const response = await fetch(uploadFreeHost, {
            method: "POST",
            body: formData as any,
            headers: {
              ...formData.getHeaders(),
              Connection: "close",
            },
          });

          // Log response details for debugging
          const responseText = await response.text();
          console.log("Response status:", response.status);
          console.log("Response body:", responseText);

          if (!response.ok) {
            // Try to parse error details from freeimage.host
            try {
              const errorInfo = JSON.parse(responseText);
              throw new Error(
                `External service error: ${response.status} - ${
                  errorInfo.error?.message ||
                  errorInfo.status_txt ||
                  response.statusText
                }`
              );
            } catch (parseError) {
              throw new Error(
                `External service error: ${response.status} ${response.statusText} - ${responseText}`
              );
            }
          }

          const data = JSON.parse(responseText);
          console.log("✅ Image uploaded to external service successfully");

          // You can access the uploaded image URL from the response
          const imageUrl = data.image?.url;
          //store avatar in the user profile
          if (req.user && req.user.id && imageUrl) {
            const user = await User.findOne(req.user.id);
            if (user) {
              user.cover = imageUrl;
              await user.save();
              res.status(200).json({
                message: "Image uploaded successfully",
                payload: {
                  ...user,
                  token: Token.generateToken({
                    id: user.id,
                    email: user.email,
                    avatar: user.avatar,
                    cover: user.cover,
                    username: user.username,
                    description: user.description,
                    admin: user.admin,
                    type: user.type,
                  }),
                },
              });
            } else {
              console.warn("User not found");
              res.status(404).json({ message: "User not found" });
            }
          } else {
            console.warn("User not found or image URL is missing");
            return res.status(400).json({
              message: "User not found or image URL is missing",
            });
          }
        } catch (fetchError) {
          console.error("❌ Fetch error:", fetchError);
          res.status(500).json({
            message: "Failed to upload to external service",
            error:
              fetchError instanceof Error
                ? fetchError.message
                : "Unknown error",
          });
        }
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    console.error("❌ Error in uploadAvatar:", error);
    res.status(500).json({
      message: "Error uploading avatar",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserProfileByUsername = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.params;
    console.log("Fetching user profile for username:", username);
    const user = await User.findOne(undefined, undefined, username);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const { email, password, type, ...info } = user;
    res.status(200).json(info);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const user = await User.findOne(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.password = await PasswordUtils.hashPassword(newPassword);
    const result = await user.save();
    res.status(200).json({ message: "Password changed successfully", result });
  } catch (err) {
    next(err);
  }
};

export const handleFollowUser = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const user = await User.findOne(Number(userId));
    if (!user) {
      res.status(401).json({ message: "cannot authenticate user" });
      return;
    }
    console.log(user.id);
    await user.followUser(Number(id));
    res.status(200).json({ message: `you has been followd ${id}` });
  } catch (err) {
    next(err);
  }
};

export const userStats = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.query;
    let userId = username || undefined;
    const userState = await User.userStats(username as string);
    console.log(userState);
    res.status(200).json(userState);
  } catch (err) {
    next(err);
  }
};

export const sendOTPVerified = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    if (type !== "email" && type !== "phone" && type !== "password_reset") {
      res.status(400).json({ message: "Invalid type" });
      return;
    }
    const { email } = req.body;
    const user = await User.findOne(undefined, email);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const otp = await UserVerification.sendOTP(Number(user.id), type);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    const { type } = req.params;
    const info = await UserVerification.checkOTP(email, otp, type);
    if (!info) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
    res.status(200).json({
      message: "OTP verified successfully",
      credential: Token.generateToken({
        id: info.id,
        email: info.email,
        username: info.username,
        admin: info.admin,
        type: info.type,
      }),
    });
  } catch (err) {
    next(err);
  }
};
