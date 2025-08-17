import { Request, Response, NextFunction } from "express";
import { CryptoUtils } from "../utility/CryptoUtils";
import { Post } from "../models";

export const encryptContentPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    // Assuming you have a function to encrypt content
    const encryptedContent = await CryptoUtils.encrypt(
      req.body.content,
      postId
    );
    res.status(200).json({ encryptedContent });
  } catch (error) {
    next(error);
  }
};

export const decryptContentPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const decryptedContent = await CryptoUtils.decrypt(
      req.body.content,
      postId
    );
    res.status(200).json({ decryptedContent });
  } catch (error) {
    next(error);
  }
};

export const turnOnEncryptionPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId);
    const { key } = req.body;
    const findedPost = await Post.findById(postId);
    if (!findedPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    if (findedPost.isLocked == false) {
      findedPost.isLocked = true;
      findedPost.content = await CryptoUtils.encrypt(findedPost.content, key);
      await findedPost.updatePostInfo(postId, {
        isLocked: findedPost.isLocked,
        content: findedPost.content,
      });
      res.status(200).json({
        message: "Post encryption turned on successfully",
        post: findedPost,
      });
      return;
    }
    res.status(400).json({ message: "Post is already encrypted" });
  } catch (error) {
    next(error);
  }
};

export const turnOffEncryptionPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId);
    const { key } = req.body;
    const findedPost = await Post.findById(postId);
    if (!findedPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    if (findedPost.isLocked == true) {
      findedPost.isLocked = false;
      findedPost.content = (await CryptoUtils.decrypt(
        findedPost.content,
        key
      )) as string;
      await findedPost.updatePostInfo(postId, {
        isLocked: findedPost.isLocked,
        content: findedPost.content,
      });
      res.status(200).json({
        message: "Post encryption turned off successfully",
        post: findedPost,
      });
      return;
    }
    res.status(400).json({ message: "Post is already decrypted" });
  } catch (error) {
    next(error);
  }
};
