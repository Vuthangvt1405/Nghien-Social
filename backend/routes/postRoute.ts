import express from "express";
import {
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
  likePost,
  dislikePost,
  getPostBySlug,
  getOnePostBySlug,
  getPostByUsername,
} from "../controllers/postController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { paginationMiddleware } from "../middlewares/paginationMiddleware";

const router = express.Router();
//get all post
router
  .route("/")
  .post(authMiddleware, createPost)
  .get(paginationMiddleware, getAllPosts);

//find post by slug (use in front end) to search for posts
//this is used to get all posts with the same slug
router.route("/slug/one/:slug").get(getOnePostBySlug);
router.route("/slug/:slug").get(getPostBySlug);

//find one post by id
//this is used to get a single post by id
//this is used to owner of this post handle own post
router.route("/:id").patch(authMiddleware, updatePost).get(getPostById);

//get post by username
router.route("/username/:username").get(getPostByUsername);

//react post api
router.route("/react/like/:postId").post(authMiddleware, likePost);
router.route("/react/dislike/:postId").post(authMiddleware, dislikePost);

export { router as postRouter };
