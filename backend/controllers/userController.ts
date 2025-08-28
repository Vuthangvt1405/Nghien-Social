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

    console.log(123);

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
    const token = req.headers["x-google-token"] as string;
    if (!token) {
      res.status(400).json({ message: "Google token is required" });
      return;
    }
    const user = await Token.verifyGoogleToken(token);
    //find if user already exist
    console.log(user);
    const existingUser = await User.findOne(undefined, user.email);
    console.log("Existing user:", existingUser);
    if (existingUser) {
      res.status(200).json({
        ...existingUser,
        token: Token.generateToken({
          id: existingUser.id,
          email: existingUser.email,
          avatar: existingUser.avatar,
          cover: existingUser.cover,
          username: existingUser.username,
          description: existingUser.description,
          admin: existingUser.admin,
          type: existingUser.type,
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

    if (username) user.username = username || user.username.trim();
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
): Promise<void> => {
  // Khai báo rõ ràng kiểu trả về là Promise<void>
  try {
    // 1. Xác thực rằng middleware đã cung cấp file
    if (!req.file) {
      res.status(400).json({ message: "No file was uploaded." });
      return; // Dùng return rỗng để thoát khỏi hàm
    }

    // 2. Xác thực các biến môi trường
    const uploadFreeHost = process.env.UPLOAD_FREE_HOST_URL;
    const apiKeyFreeHost = process.env.UPLOAD_FREE_HOST_API_KEY;

    if (!uploadFreeHost || !apiKeyFreeHost) {
      console.error("Upload service URL or API key is not configured.");
      res.status(500).json({ message: "Server upload is not configured." });
      return; // Dùng return rỗng để thoát khỏi hàm
    }

    // 3. Chuẩn bị form data cho API bên ngoài
    const formData = new FormData();
    formData.append("key", apiKeyFreeHost);
    formData.append("source", req.file.buffer.toString("base64"));
    formData.append("format", "json");

    // 4. Tải ảnh lên dịch vụ bên ngoài
    const response = await fetch(uploadFreeHost, {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseData?.error?.message ||
        responseData?.status_txt ||
        "Failed to upload to external service";
      // Tạo một lỗi mới để được bắt bởi middleware xử lý lỗi
      throw new Error(
        `External API Error: ${response.status} - ${errorMessage}`
      );
    }

    const imageUrl = responseData.image?.url;
    if (!imageUrl) {
      throw new Error(
        "Image URL not found in the response from the external service."
      );
    }

    // 5. Cập nhật bản ghi người dùng trong cơ sở dữ liệu
    const user = await User.findOne(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return; // Dùng return rỗng để thoát khỏi hàm
    }

    user.avatar = imageUrl; // <-- Điểm khác biệt chính: cập nhật trường 'avatar'
    await user.save();

    // 6. Phản hồi với dữ liệu người dùng đã được cập nhật và một token mới
    res.status(200).json({
      message: "Avatar uploaded successfully!",
      payload: {
        ...user,
        // Tạo một token mới với URL avatar đã được cập nhật
        token: Token.generateToken({
          id: user.id,
          email: user.email,
          avatar: user.avatar, // Đã được cập nhật
          cover: user.cover,
          username: user.username,
          description: user.description,
          admin: user.admin,
          type: user.type,
        }),
      },
    });
  } catch (error) {
    // Chuyển tiếp bất kỳ lỗi nào đến middleware xử lý lỗi tập trung của bạn
    next(error);
  }
};

export const uploadCover = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Validate that the middleware provided a file
    if (!req.file) {
      res.status(400).json({ message: "No file was uploaded." });
      return;
    }

    // 2. Validate environment variables
    const uploadFreeHost = process.env.UPLOAD_FREE_HOST_URL;
    const apiKeyFreeHost = process.env.UPLOAD_FREE_HOST_API_KEY;

    if (!uploadFreeHost || !apiKeyFreeHost) {
      // It's better to log this issue on the server
      console.error("Upload service URL or API key is not configured.");
      res.status(500).json({ message: "Server upload is not configured." });
      return;
    }

    // 3. Prepare form data for the external API
    const formData = new FormData();
    formData.append("key", apiKeyFreeHost);
    formData.append("source", req.file.buffer.toString("base64"));
    formData.append("format", "json");

    // 4. Upload to the external service
    const response = await fetch(uploadFreeHost, {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseData?.error?.message ||
        responseData?.status_txt ||
        "Failed to upload to external service";
      // Create a new error to be caught by the error handler
      throw new Error(
        `External API Error: ${response.status} - ${errorMessage}`
      );
    }

    const imageUrl = responseData.image?.url;
    if (!imageUrl) {
      throw new Error(
        "Image URL not found in the response from the external service."
      );
    }

    // 5. Update the user record in the database
    const user = await User.findOne(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    user.cover = imageUrl;
    await user.save();

    // 6. Respond with the updated user data and a new token
    res.status(200).json({
      message: "Cover image uploaded successfully!",
      payload: {
        ...user,
        // Generate a new token with the updated cover URL
        token: Token.generateToken({
          id: user.id,
          email: user.email,
          avatar: user.avatar,
          cover: user.cover, // Now updated
          username: user.username,
          description: user.description,
          admin: user.admin,
          type: user.type,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfileByUsername = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.params;
    console.log("Fetching user profile for username (raw):", username);
    const decodedUsername = decodeURIComponent(username).trim();
    console.log(
      "Fetching user profile for username (decoded):",
      decodedUsername
    );
    const user = await User.findOne(undefined, undefined, `${decodedUsername}`);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const { password, type, ...info } = user;
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
    const { newPassword, oldPassword } = req.body;
    const userId = req.user?.id;
    if (!userId || userId == undefined) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    console.log("Changing password for user ID:", userId);

    const user = await User.findOne(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!(await PasswordUtils.comparePassword(oldPassword, user.password))) {
      res.status(401).json({ message: "Old password is incorrect" });
      return;
    }

    user.password = await PasswordUtils.hashPassword(newPassword);
    const result = await user.save();
    res.status(200).json({ message: "Password changed successfully" });
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
    const { username } = req.params;
    const userId = req.user?.id;

    const user = await User.findOne(Number(userId));
    if (!user) {
      res.status(401).json({ message: "cannot authenticate user" });
      return;
    }

    const userToFollow = await User.findOne(undefined, undefined, username);
    if (!userToFollow) {
      res.status(404).json({ message: "User to follow not found" });
      return;
    }

    await user.followUser(Number(userToFollow.id));
    res.status(200).json({ message: `you has been followd ${username}` });
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
