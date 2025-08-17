import { Request, Response, NextFunction } from "express";
import { RequestExtendUser, UserInput, UserUpdateInput } from "../dto";
import { Post } from "../models";
import { Token } from "../utility";
import { JwtPayload } from "jsonwebtoken";

export const createPost = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, caption, content, isLocked } = req.body;
    const ownerId = req.user?.id; // Assuming req.user is set by an auth middleware
    await Post.create(ownerId as number, title, caption, content, isLocked);
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
    const result = await post.likePost(userId, parseInt(postId));
    res.status(200).json({ result });
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

    const result = await post.dislikePost(userId, Number(postId));

    res.status(200).json({
      success: true,
      message: `Post ${result.action} successfully`,
      data: {
        action: result.action,
        affectedRows: result.affectedRows,
        insertId: result.insertId,
      },
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
    const posts = await Post.getPostUser(username);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
