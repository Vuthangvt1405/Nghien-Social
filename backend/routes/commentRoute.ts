import express from "express";
import {
  createComment,
  getAllComments,
  getCommentById,
  editCommentId,
  getCommentByPostId,
  deleteCommentByOwner,
  likeComment,
  dislikeComment,
} from "../controllers";
import { authMiddleware } from "../middlewares";

const router = express.Router();

router.route("/").get(getAllComments);

router
  .route("/comment/:commentId")
  .get(getCommentById)
  .patch(authMiddleware, editCommentId);

//reaction comment
router.route("/comment/like/:commentId").post(authMiddleware, likeComment);
router
  .route("/comment/dislike/:commentId")
  .post(authMiddleware, dislikeComment);

router
  .route("/post/:postId")
  .post(authMiddleware, createComment)
  .get(getCommentByPostId);

router
  .route("/post/:postId/:commentId")
  .delete(authMiddleware, deleteCommentByOwner);

export { router as commentRouter };
