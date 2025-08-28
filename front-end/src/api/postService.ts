import apiService from "./apiService";
import { type AxiosResponse } from "axios";
import { type CreatePostData } from "./types";

class PostService {
  getAllPosts() {
    // apiService will automatically add the auth token if it exists.
    return apiService.get("/posts");
  }

  getPostsByUsername(username: string) {
    return apiService.get(`/posts/username/${username}`);
  }

  createPost(data: CreatePostData): Promise<
    AxiosResponse<{
      success: boolean;
      message?: string;
      post?: { id: string | number };
    }>
  > {
    return apiService.post("/posts", data);
  }

  getPostBySlug(slug: string) {
    return apiService.get(`/posts/slug/${slug}`);
  }

  getDataPostBySlug(slug: string) {
    return apiService.get(`/posts/slug/one/${slug}`);
  }

  likePost(postId: number) {
    return apiService.post(`/posts/react/like/${postId}`);
  }

  dislikePost(postId: number) {
    return apiService.post(`/posts/react/dislike/${postId}`);
  }

  encryptPostContent = (postId: number, key: string) => {
    const response = apiService.patch(`/crypto/post/encrypt/${postId}`, {
      key,
    });
    console.log(response);
    return response;
  };
}

export default new PostService();
