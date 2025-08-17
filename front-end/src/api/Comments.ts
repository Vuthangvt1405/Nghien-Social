// src/api/Comments.ts
import { userAPI } from "./rootApi";

export const getAllComments = async () => {
  const res = await userAPI.get("/comments/");
  return res.data;
};

// Lấy comment theo post ID
export const getCommentsOfPost = async (postId: number) => {
  const res = await userAPI.get(`/comments/post/${postId}`);
  return res.data;
};

export const commentPost = async (
  postId: number,
  commentData: { content: string }
) => {
  const res = await userAPI.post(`/comments/post/${postId}`, commentData);
  return res.data;
};

export const updateComment = async (commentId: number, content: string) => {
  const res = await userAPI.patch(`/comments/comment/${commentId}`, {
    content,
  });
  return res.data;
};

export const deleteComment = async (postId: number, commentId: number) => {
  const res = await userAPI.delete(`/comments/post/${postId}/${commentId}`);
  return res.data;
};

export const likeComment = async (commentId: number) => {
  const res = await userAPI.post(`/comments/comment/like/${commentId}`);
  return res.data;
};

export const dislikeComment = async (commentId: number) => {
  const res = await userAPI.post(`/comments/comment/dislike/${commentId}`);
  return res.data;
};

export const replyComment = async (
  postId: number,
  payload: { content: string; parentComment_id: number }
) => {
  const res = await userAPI.post(`/comments/post/${postId}`, payload);
  return res.data;
};
