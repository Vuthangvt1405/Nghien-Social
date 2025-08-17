import { Request, Response, NextFunction } from "express";
import { Comment } from "../models";
import { RequestExtendUser } from "../dto";
import { CommentNode } from "../dto/Comment.dto";

export const getAllComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const comments = await Comment.findAll();
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const createComment = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;
    console.log(postId, req.user?.id);
    if (typeof req.user?.id !== "number") {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    const newComment = await Comment.create(
      parseInt(postId),
      req.user.id,
      req.body
    );

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const getCommentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;
    if (isNaN(Number(commentId))) {
      res.status(400).json({ message: "Invalid comment ID" });
    }
    let comment = await Comment.findById(parseInt(commentId));
    if (!comment) {
      res.status(400).json({ message: "comment does not exist !" });
      return;
    }

    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const editCommentId = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    //check comment exists
    const existingComment = await Comment.findById(parseInt(commentId));
    if (!existingComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    //check owner
    console.log(existingComment.user_id, req.user?.id);

    if (existingComment.user_id !== req.user?.id) {
      res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
      return;
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ message: "No data provided for update" });
      return;
    }

    const updatedComment = await Comment.update(parseInt(commentId), content);
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

const buildCommentTree = (comments: CommentNode[]): CommentNode[] => {
  const commentMap: { [key: number]: CommentNode } = {};
  const tree: CommentNode[] = [];

  // First pass: create a map of all comments
  comments.forEach((comment: CommentNode) => {
    commentMap[comment.id] = { ...comment, children: [] };
  });

  // Second pass: build the tree structure
  comments.forEach((comment: CommentNode) => {
    if (comment.parentComment_id === null) {
      // Root comment
      tree.push(commentMap[comment.id]);
    } else {
      // Child comment - add to parent's children array
      const parent = commentMap[comment.parentComment_id];
      if (parent) {
        parent.children.push(commentMap[comment.id]);
      }
    }
  });

  return tree;
};

export const getCommentByPostId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({ message: "Please provide post id" });
      return;
    }

    const id = Number(postId);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid post ID format" });
      return;
    }

    const result = await Comment.findCommentByPostId(id);
    console.log(result);
    const commentTree = buildCommentTree(result as CommentNode[]);
    res.status(200).json(commentTree);
  } catch (err) {
    next(err);
  }
};

export const deleteCommentByOwner = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;

    //check comment exists
    const existingComment = await Comment.findById(parseInt(commentId));
    if (!existingComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    //check owner
    if (existingComment.user_id !== req.user?.id) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete this comment" });
      return;
    }

    await Comment.deleteById(parseInt(commentId));
    res.status(204).json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;

    //check comment exists
    const existingComment = await Comment.findById(parseInt(commentId));
    if (!existingComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    //check owner
    if (existingComment.user_id === req.user?.id) {
      res.status(400).json({ message: "You cannot like your own comment" });
      return;
    }

    if (typeof req.user?.id !== "number") {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const updatedComment = await Comment.likeComment(
      req.user.id,
      parseInt(commentId)
    );
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const dislikeComment = async (
  req: RequestExtendUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;

    //check comment exists
    const existingComment = await Comment.findById(parseInt(commentId));
    if (!existingComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    //check owner
    if (existingComment.user_id === req.user?.id) {
      res.status(400).json({ message: "You cannot dislike your own comment" });
      return;
    }

    if (typeof req.user?.id !== "number") {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const updatedComment = await Comment.dislikeComment(
      req.user.id,
      parseInt(commentId)
    );
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};
