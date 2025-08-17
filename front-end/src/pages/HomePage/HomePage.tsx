import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getAllPosts } from "../../api/Post";
import PostCard from "../../components/PostCard/PostCard";

interface Post {
  id: number;
  ownerId: number;
  title: string;
  caption: string;
  content: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string;
  email: string;
  avatar: string;
  admin: boolean;
  total_like: number;
  cover?: string;
}

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = async () => {
    const posts = await getAllPosts();
    setPosts(posts);
  };

  useEffect(() => {
    fetchPosts();
    const intervalId = setInterval(fetchPosts, 500); // refresh every 500 miliseconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Layout>
      <div className="flex flex-col items-center max-w-4xl gap-4 mx-auto mt-4">
        {posts.map((item, i) => (
          <PostCard key={i} item={item} />
        ))}
      </div>
    </Layout>
  );
};

export default HomePage;
