import apiService from "./apiService";

class PostService {
  getAllPosts() {
    // apiService will automatically add the auth token if it exists.
    return apiService.get("/posts");
  }

  getPostsByUsername(username: string) {
    return apiService.get(`/posts/username/${username}`);
  }

  createPost(data: any) {
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
}

export default new PostService();
