import { TiArrowDownThick, TiArrowUpThick } from "react-icons/ti";
import { useState } from "react";
import { dislikePost, likePost } from "../../api/Post";
import { Link } from "react-router-dom";
import images from "../../constants";
import { MdOutlineLock } from "react-icons/md";

const PostCard = ({ item }) => {
  const [likes, setLikes] = useState(item.total_likes);
  const [dislikes, setDislikes] = useState(item.total_dislikes);
  const [userReaction, setUserReaction] = useState(item.user_reaction); // 1: like, 0: dislike, null: no reaction

  const handleLike = async () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) {
      window.location.href = `${import.meta.env.VITE_URL_BASE_WEB}/login`;
      return;
    }

    try {
      const response = await likePost(item.id);
      const updatedPost = response.data.post;
      setLikes(updatedPost.total_likes);
      setDislikes(updatedPost.total_dislikes);
      setUserReaction(updatedPost.user_reaction);
    } catch (error) {
      console.error("Failed to like the post:", error);
      // Optionally, show an error message to the user
    }
  };

  const handleDislike = async () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) {
      window.location.href = `${import.meta.env.VITE_URL_BASE_WEB}/login`;
      return;
    }

    try {
      const response = await dislikePost(item.id);
      const updatedPost = response.data.post;
      setLikes(updatedPost.total_likes);
      setDislikes(updatedPost.total_dislikes);
      setUserReaction(updatedPost.user_reaction);
    } catch (error) {
      console.error("Failed to dislike the post:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="max-w-xl my-6 overflow-hidden bg-white rounded-lg shadow-md min-w-[75%]">
      {/* Header */}
      <Link
        to={`/post/${item.slug}`}
        className="flex items-center justify-between px-6 py-4 border-b"
      >
        <div className="flex items-center">
          <img
            src={item.avatar || images.avatarDemo}
            alt="avatar"
            className="object-cover w-12 h-12 rounded-full"
          />
          <div className="ml-4">
            <p className="font-semibold text-gray-800">{item.owner}</p>
          </div>
          {item.isLocked != 0 ? (
            <>
              <MdOutlineLock className="ml-2 text-gray-500" />
              <span className="ml-1 text-sm text-gray-500">Private</span>
            </>
          ) : (
            <></>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/post/${item.slug}`}>
          <h2 className="mb-2 text-xl font-bold text-gray-800">{item.title}</h2>
          <p className="mb-4 text-gray-700">{item.caption}</p>
        </Link>
        {item.cover && (
          <Link to={`/post/${item.slug}`}>
            <img
              className="object-cover w-full rounded-md"
              src={item.cover}
              alt="Cover"
            />
          </Link>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center justify-center gap-4 p-4">
        <button
          onClick={handleLike}
          className={`text-xl ${
            userReaction === 1
              ? "text-green-500"
              : "text-gray-600 hover:text-green-400"
          }`}
        >
          <TiArrowUpThick />
        </button>

        <span className="text-sm text-gray-700">{likes} Likes</span>

        <button
          onClick={handleDislike}
          className={`text-xl ${
            userReaction === 0
              ? "text-red-500"
              : "text-gray-600 hover:text-red-400"
          }`}
        >
          <TiArrowDownThick />
        </button>

        <span className="text-sm text-gray-700">{dislikes} Dislikes</span>
      </div>
    </div>
  );
};

export default PostCard;
