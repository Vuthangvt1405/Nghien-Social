import { userAPI, userAPINoAuth } from "./rootApi";

// === POST APIs ===
export const getAllPosts = async () => {
  if (document.cookie.includes("authToken")) {
    const response = await userAPI.get("/posts");
    return response.data;
  }
  const response = await userAPINoAuth.get("/posts");
  return response.data;
};

export const getAllPostBySlug = async (slug: string) => {
  const post = await userAPI.get(`/posts/slug/${slug}`);
  return post;
};

export const getDataPostBySlug = async (slug: string) => {
  const response = await userAPI.get(`/posts/slug/one/${slug}`);
  console.log(response);
  return response;
};

export const likePost = async (postId: number) => {
  const response = await userAPI.post(`/posts/react/like/${postId}`);
  console.log(response);
  return response;
};

export const dislikePost = async (postId: number) => {
  const response = await userAPI.post(`/posts/react/dislike/${postId}`);
  console.log(response);
  return response;
};
