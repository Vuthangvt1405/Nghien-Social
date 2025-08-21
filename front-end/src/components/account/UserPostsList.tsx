import React from "react";
import { useQuery } from "@tanstack/react-query";
import { postService } from "../../api/Client";
import PostCard from "../PostCard/PostCard"; // Assuming you have a PostCard component

interface Post {
  id: number;
  ownerId: number;
  title: string;
  caption: string;
  content: string;
  slug: string;
  cover: string | null;
  isLocked: number;
  created_at: string;
  updated_at: string;
  owner?: string;
  avatar?: string;
  total_likes?: number;
  total_dislikes?: number;
  user_reaction?: number | null;
}

interface UserPostsListProps {
  username: string;
}

const UserPostsList: React.FC<UserPostsListProps> = ({ username }) => {
  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userPosts", username],
    queryFn: () =>
      postService.getPostsByUsername(username).then((res) => res.data),
    enabled: !!username,
  });

  console.log("User Posts:", posts);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <p className="text-gray-600">Loading posts...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load posts. Please try again later.
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        This user hasn't posted anything yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-4xl gap-4 mx-auto mt-4">
      {posts.map((post: Post) => (
        <PostCard key={post.id} item={post} />
      ))}
    </div>
  );
};

export default UserPostsList;
