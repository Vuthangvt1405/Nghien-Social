import { Request, Response, NextFunction } from "express";
import { RequestExtendUser, UserInput, UserUpdateInput } from "../dto";
import { Post } from "../models";
import { Token } from "../utility";
import multer from "multer";
import type FormDataType from "form-data";

interface UploadResponse {
  status_code: number;
  success: {
    message: string;
  };
  image: {
    url: string;
    display_url: string;
    size: number;
    time: string;
    expiration: string;
  };
}

export const createPost = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, caption, cover, content, isLocked } = req.body;
    const ownerId = req.user?.id; // Assuming req.user is set by an auth middleware
    await Post.create(
      ownerId as number,
      title,
      caption,
      content,
      cover,
      isLocked
    );
    res.status(201).json({
      message: "Post created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content, password, isLocked } = req.body;
    const ownerId = req.user?.id; // Assuming req.user is set by an auth middleware

    const post = await Post.findById(postId);

    if (post.ownerId !== ownerId) {
      res
        .status(403)
        .json({ message: "You are not authorized to update this post" });
      return;
    }

    const updatedPost = await post.updatePostInfo(postId, {
      title,
      content,
      password,
      isLocked,
    });

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await Post.findById(postId);
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const getPostBySlug = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const result = await Post.findBySlug(slug);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const likePost = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    const post = await Post.findById(parseInt(postId));

    //execute like post
    await post.likePost(userId, parseInt(postId));

    // Fetch the updated post data
    const updatedPost = await Post.getPostAndReaction(parseInt(postId), userId);

    res.status(200).json({
      message: "Post liked successfully",
      post: updatedPost,
    });
  } catch (err) {
    next(err);
  }
};

export const dislikePost = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    // Validation
    if (!postId || !userId) {
      res.status(400).json({
        success: false,
        error: "Missing required parameters: postId or userId",
      });
      return;
    }

    if (!Number.isInteger(Number(postId))) {
      res.status(400).json({
        success: false,
        error: "Invalid postId format",
      });
      return;
    }

    //find post
    const post = await Post.findById(Number(postId));

    await post.dislikePost(userId, Number(postId));

    // Fetch the updated post data
    const updatedPost = await Post.getPostAndReaction(parseInt(postId), userId);

    res.status(200).json({
      message: "Post disliked successfully",
      post: updatedPost,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllPosts = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      const posts = await Post.findAll();
      console.log(posts);
      const postsWithoutContent = posts.map(({ content, ...post }) => post);
      res.status(200).json(postsWithoutContent);
    } else {
      const user = await Token.verifyToken(
        req.headers.authorization.split(" ")[1]
      );
      req.user = user
        ? {
            id: user.id ?? user.userId, // handle both id and userId
            email: user.email,
            username: user.username,
            admin: user.admin,
          }
        : undefined;
      const result = await Post.getAllPostAndReactionByUser(
        Number(req.user?.id)
      );
      res.status(200).json(result);
    }
  } catch (err) {
    next(err);
  }
};

export const getOnePostBySlug = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const result = await Post.findOnePostBySlug(slug);
    if (req.headers.authorization) {
      const user = await Token.verifyToken(
        req.headers.authorization?.split(" ")[1]
      );
      result.user = user;
      const react = await Post.isUserReactThisPost(
        result.id,
        user?.id as number
      );

      if (react || react == 0) result.react = react;
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getPostByUsername = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.params;

    // Trường hợp 1: Người dùng chưa đăng nhập (không có token)
    if (!req.headers.authorization) {
      const posts = await Post.getPostUser(username); // Dùng hàm cũ để lấy post
      // Tùy chọn: bạn có thể bỏ field `content` nếu muốn cho nhất quán
      // const postsWithoutContent = posts.map(({ content, ...post }) => post);
      res.status(200).json(posts);
    }
    // Trường hợp 2: Người dùng đã đăng nhập (có token)
    else {
      // Xác thực token và lấy thông tin user đang đăng nhập
      const user = await Token.verifyToken(
        req.headers.authorization.split(" ")[1]
      );
      req.user = user
        ? {
            id: user.id ?? user.userId, // handle both id and userId
            email: user.email,
            username: user.username,
            admin: user.admin,
          }
        : undefined;

      // Gọi một hàm mới trong Model để lấy post của `username`
      // và reaction của user đang đăng nhập (`req.user.id`)
      const postsWithReactions = await Post.getPostsByUsernameAndReactionByUser(
        username,
        Number(req.user?.id)
      );

      res.status(200).json(postsWithReactions);
    }
  } catch (err) {
    next(err);
  }
};

export const uploadPictureGetUrl = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Promisify multer upload
    await new Promise<void>((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error("❌ Multer error:", err);
          return reject(new Error(`Upload error: ${err.message}`));
        }
        resolve();
      });
    });

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return; // ← Không return res.status()
    }

    console.log("✅ Image received:");
    console.log("Filename:", req.file.originalname);
    console.log("MIME Type:", req.file.mimetype);
    console.log("Size:", req.file.size, "bytes");

    const uploadFreeHost = process.env.UPLOAD_FREE_HOST_URL;
    const apiKeyFreeHost = process.env.UPLOAD_FREE_HOST_API_KEY;

    if (!uploadFreeHost || !apiKeyFreeHost) {
      res.status(500).json({
        success: false,
        message: "Upload host or API key not configured",
      });
      return; // ← Không return res.status()
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");
    const formData = new FormData();
    formData.append("key", apiKeyFreeHost);
    formData.append("action", "upload");
    formData.append("format", "json");
    formData.append("source", base64Image);

    console.log("Uploading to:", uploadFreeHost);
    console.log("Using API key:", apiKeyFreeHost.substring(0, 8) + "...");

    const response = await fetch(uploadFreeHost, {
      method: "POST",
      body: formData as any,
    });

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseText);

    if (!response.ok) {
      let errorMessage = `External service error: ${response.status} ${response.statusText}`;

      try {
        const errorInfo = JSON.parse(responseText);
        errorMessage =
          errorInfo.error?.message || errorInfo.status_txt || errorMessage;
      } catch (parseError) {
        console.warn("Could not parse error response:", parseError);
      }

      res.status(502).json({
        success: false,
        message: errorMessage,
        details: responseText,
      });
      return; // ← Không return res.status()
    }

    // Parse successful response
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      res.status(502).json({
        success: false,
        message: "Invalid response from upload service",
        details: responseText,
      });
      return; // ← Không return res.status()
    }

    // Check if upload was successful
    if (responseData.status_code !== 200) {
      res.status(502).json({
        success: false,
        message: "Upload failed on external service",
        details: responseData,
      });
      return; // ← Không return res.status()
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Upload successful",
      data: {
        url: responseData.image.url,
        display_url: responseData.image.display_url,
        size: responseData.image.size,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
      },
    });
    // ← Không return gì ở đây
  } catch (error) {
    console.error("❌ Upload error:", error);
    next(error); // ← Không return next(error)
  }
};

export const cloneUpload = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.file);

    if (!req.file) {
      next(new Error("No file uploaded"));
      return;
    }
    const uploadFreeHost = process.env.UPLOAD_FREE_HOST_URL;
    const apiKeyFreeHost = process.env.UPLOAD_FREE_HOST_API_KEY;

    if (!apiKeyFreeHost || !uploadFreeHost) {
      next(new Error("check API key and upload host URL"));
      return;
    }

    const formData = new FormData();
    formData.append("key", apiKeyFreeHost);
    formData.append("action", "upload");
    formData.append("source", req.file.buffer.toString("base64"));
    formData.append("format", "json");

    const response = await fetch(uploadFreeHost, {
      method: "POST",
      body: formData as any,
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
