import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "./ComponentPost.css";
import {
  getCommentsOfPost,
  commentPost,
  likeComment,
  dislikeComment,
  replyComment,
  updateComment,
  deleteComment,
} from "../../api/Comments";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChatBubbleLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  UserCircleIcon,
  ChevronRightIcon,
  EyeSlashIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronUpIcon as ChevronUpSolid,
  ChevronDownIcon as ChevronDownSolid,
} from "@heroicons/react/24/solid";
import { decodeJWT } from "../../utils/Crypto";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import images from "../../constants";

interface Props {
  postId: number;
}

interface Comment {
  id: number;
  content: string;
  parentComment_id: number | null;
  post_id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  username: string;
  email: string;
  avatar: string | null;
  cover: string | null;
  admin: number;
  reaction_count: number;
  likes: string;
  dislikes: string;
  reactions: {
    id: number;
    user: { id: number; name?: string; email?: string } | null;
    reaction: number;
  }[];
  children: Comment[];
}

// Types cho comment management
type SortOption = "newest" | "oldest" | "most_liked" | "most_discussed";
type FilterOption = "all" | "my_comments" | "replies_to_me";

interface CommentState {
  collapsed: Set<number>;
  hidden: Set<number>;
  sortBy: SortOption;
  filterBy: FilterOption;
  currentPage: number;
  commentsPerPage: number;
}

// Helper functions (giữ nguyên từ code cũ)
const hasUserReacted = (
  reactions: Comment["reactions"],
  userId: number | null
): boolean => {
  if (!userId || !reactions || reactions.length === 0) return false;
  return reactions.some((r) => r?.user?.id === userId);
};

const getReactionCounts = (reactions: Comment["reactions"]) => {
  const validReactions = reactions.filter((r) => r !== null);
  const likes = validReactions.filter((r) => r.reaction === 1).length;
  const dislikes = validReactions.filter((r) => r.reaction !== 1).length;
  return { likes, dislikes, total: validReactions.length };
};

const getReactionUsers = (
  reactions: Comment["reactions"],
  reactionType: number
) => {
  return reactions
    .filter((r) => r !== null && r.reaction === reactionType && r.user)
    .map((r) => r.user!);
};

const getCurrentUserId = (): number | null => {
  const authToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];

  if (!authToken) return null;

  const decoded = decodeJWT(authToken);
  return decoded?.id || decoded?.userId || null;
};

const getUserReaction = (
  reactions: Comment["reactions"],
  userId: number | null
): "like" | "dislike" | null => {
  if (!userId || !reactions || reactions.length === 0) return null;

  const validReactions = reactions.filter((r) => r !== null);
  const userReaction = validReactions.find((r) => r.user?.id === userId);

  if (!userReaction) return null;

  if (userReaction.reaction === 1) return "like";
  if (userReaction.reaction === 0 || userReaction.reaction === -1)
    return "dislike";

  return null;
};

// Enhanced Tooltip Component
const ReactionTooltip: React.FC<{
  reactions: Comment["reactions"];
  children: React.ReactNode;
}> = ({ reactions, children }) => {
  const { likes, dislikes } = getReactionCounts(reactions);
  const likeUsers = getReactionUsers(reactions, 1);
  const dislikeUsers = getReactionUsers(reactions, 0);

  if (likes === 0 && dislikes === 0) return <>{children}</>;

  const tooltipContent = (
    <div className="max-w-xs text-xs">
      {likes > 0 && (
        <div className="mb-1">
          <span className="text-orange-500">👍 {likes}: </span>
          <span className="break-words">
            {likeUsers.map((u) => u.name || u.email).join(", ")}
          </span>
        </div>
      )}
      {dislikes > 0 && (
        <div>
          <span className="text-blue-500">👎 {dislikes}: </span>
          <span className="break-words">
            {dislikeUsers.map((u) => u.name || u.email).join(", ")}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative group">
      {children}
      <div className="absolute z-50 max-w-xs px-3 py-2 mb-2 text-xs text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-900 rounded-lg opacity-0 pointer-events-none bottom-full left-1/2 group-hover:opacity-100 whitespace-nowrap">
        {tooltipContent}
        <div className="absolute w-0 h-0 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent top-full left-1/2 border-t-gray-900"></div>
      </div>
    </div>
  );
};

// Loading skeleton (giữ nguyên)
const CommentSkeleton: React.FC = () => (
  <div className="p-4 mb-3 bg-white rounded-lg shadow-sm animate-pulse">
    <div className="flex">
      <div className="flex flex-col items-center pr-4 min-w-[50px]">
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
        <div className="w-6 h-4 mt-1 bg-gray-200 rounded"></div>
        <div className="w-6 h-6 mt-1 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 mr-2 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full h-4 mb-2 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
        <div className="flex space-x-4">
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
          <div className="w-8 h-3 bg-gray-200 rounded"></div>
          <div className="w-8 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Reddit Comment Component
const RedditComment: React.FC<{
  comment: Comment;
  postId: number;
  level?: number;
  commentState: CommentState;
  onToggleCollapse: (commentId: number) => void;
  onToggleHide: (commentId: number) => void;
  currentUserId?: number | null;
}> = ({
  comment,
  postId,
  level = 0,
  commentState,
  onToggleCollapse,
  onToggleHide,
  currentUserId: propCurrentUserId,
}) => {
  const qc = useQueryClient();

  // States
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  // Animation states
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isDislikeAnimating, setIsDislikeAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Get current user ID
  const currentUserId = propCurrentUserId ?? getCurrentUserId();
  const isOwner = currentUserId === comment.user_id;

  // Check states
  const isCollapsed = commentState.collapsed.has(comment.id);
  const isHidden = commentState.hidden.has(comment.id);

  // Check user's current reaction
  const userReaction = useMemo(
    () => getUserReaction(comment.reactions, currentUserId),
    [comment.reactions, currentUserId]
  );

  const hasReacted = useMemo(
    () => hasUserReacted(comment.reactions, currentUserId),
    [comment.reactions, currentUserId]
  );

  const reactionCounts = useMemo(
    () => getReactionCounts(comment.reactions),
    [comment.reactions]
  );

  // Local state cho optimistic updates
  const [localReaction, setLocalReaction] = useState<"like" | "dislike" | null>(
    userReaction
  );
  const [localLikes, setLocalLikes] = useState(parseInt(comment.likes));
  const [localDislikes, setLocalDislikes] = useState(
    parseInt(comment.dislikes)
  );

  // Update local state khi data thay đổi
  useEffect(() => {
    setLocalReaction(userReaction);
    setLocalLikes(parseInt(comment.likes));
    setLocalDislikes(parseInt(comment.dislikes));
  }, [userReaction, comment.likes, comment.dislikes]);

  // Animation functions
  const createParticles = () => {
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1000);
  };

  // Mutations (giữ nguyên logic cũ)
  const likeMut = useMutation({
    mutationFn: () => likeComment(comment.id),
    onMutate: () => {
      setIsLikeAnimating(true);
      if (localReaction !== "like") {
        createParticles();
      }
      setTimeout(() => setIsLikeAnimating(false), 600);

      if (localReaction === "like") {
        setLocalReaction(null);
        setLocalLikes((prev) => prev - 1);
      } else if (localReaction === "dislike") {
        setLocalReaction("like");
        setLocalLikes((prev) => prev + 1);
        setLocalDislikes((prev) => prev - 1);
      } else {
        setLocalReaction("like");
        setLocalLikes((prev) => prev + 1);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
    onError: () => {
      setLocalReaction(userReaction);
      setLocalLikes(parseInt(comment.likes));
      setLocalDislikes(parseInt(comment.dislikes));
    },
  });

  const dislikeMut = useMutation({
    mutationFn: () => dislikeComment(comment.id),
    onMutate: () => {
      setIsDislikeAnimating(true);
      setTimeout(() => setIsDislikeAnimating(false), 500);

      if (localReaction === "dislike") {
        setLocalReaction(null);
        setLocalDislikes((prev) => prev - 1);
      } else if (localReaction === "like") {
        setLocalReaction("dislike");
        setLocalDislikes((prev) => prev + 1);
        setLocalLikes((prev) => prev - 1);
      } else {
        setLocalReaction("dislike");
        setLocalDislikes((prev) => prev + 1);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
    onError: () => {
      setLocalReaction(userReaction);
      setLocalLikes(parseInt(comment.likes));
      setLocalDislikes(parseInt(comment.dislikes));
    },
  });

  // Other mutations (giữ nguyên)
  const replyMut = useMutation({
    mutationFn: () =>
      replyComment(postId, {
        content: replyText,
        parentComment_id: comment.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      setReplyText("");
      setIsReplying(false);
    },
  });

  const editMut = useMutation({
    mutationFn: () => updateComment(comment.id, editText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      setIsEditing(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteComment(postId, comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
  });

  // Event handlers
  const handleEdit = () => {
    if (isEditing) {
      setEditText(comment.content);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (editText.trim() && editText !== comment.content) {
      editMut.mutate();
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc muốn xóa bình luận này?")) {
      deleteMut.mutate();
    }
  };

  const handleReply = () => {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập để trả lời bình luận!");
      return;
    }
    setIsReplying(!isReplying);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText("");
  };

  // Nếu comment bị ẩn hoàn toàn
  if (isHidden) {
    return (
      <div
        className={`${
          level > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""
        } mb-3`}
      >
        <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <EyeSlashIcon className="w-4 h-4" />
              <span>Comment đã được ẩn</span>
              <span className="text-xs">
                {comment.children?.length || 0} replies
              </span>
            </div>
            <button
              onClick={() => onToggleHide(comment.id)}
              className="text-xs text-blue-600 transition-colors hover:text-blue-800"
            >
              Hiện lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu comment bị collapsed (thu gọn)
  if (isCollapsed) {
    return (
      <div
        className={`${
          level > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""
        } mb-3`}
      >
        <div className="p-3 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
          <button
            onClick={() => onToggleCollapse(comment.id)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center flex-1 min-w-0 space-x-3">
              <div className="flex items-center space-x-2">
                {comment.avatar ? (
                  <img
                    src={comment.avatar ?? undefined}
                    alt={comment.username}
                    className="w-5 h-5 rounded-full ring-1 ring-gray-200"
                  />
                ) : (
                  <img
                    src={images.avatarDemo}
                    className="w-5 h-5 rounded-full ring-1 ring-gray-200"
                    alt=""
                  />
                )}
                <span className="text-sm font-medium text-gray-700 truncate">
                  {comment.username}
                </span>
              </div>
              <span className="text-sm text-gray-500 truncate">
                {comment.content.substring(0, 60)}...
              </span>
              <div className="flex items-center space-x-2 text-xs text-gray-400 whitespace-nowrap">
                <span>{localLikes - localDislikes} điểm</span>
                <span>•</span>
                <span>{comment.children?.length || 0} replies</span>
              </div>
            </div>
            <ChevronRightIcon className="flex-shrink-0 w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        level > 0 ? "ml-3 sm:ml-6 border-l-2 border-gray-200 pl-3 sm:pl-4" : ""
      } bg-white hover:bg-gray-50 transition-colors duration-200 rounded-lg shadow-sm mb-3 p-3 sm:p-4 ${
        hasReacted && !isOwner ? "ring-1 ring-orange-100 bg-orange-50/30" : ""
      } ${isOwner ? "bg-blue-50/20 border border-blue-100" : ""}`}
    >
      {/* Vote Column */}
      <div className="flex flex-col items-center pr-3 sm:pr-4 min-w-[45px] sm:min-w-[50px]">
        {isOwner ? (
          <ReactionTooltip reactions={comment.reactions}>
            <div className="flex flex-col items-center justify-center p-2 border-2 border-gray-300 rounded-lg shadow-sm sm:p-3 bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="text-center">
                <span className="text-lg font-bold text-gray-800 sm:text-2xl tabular-nums">
                  {localLikes - localDislikes}
                </span>
                <div className="text-xs font-medium text-gray-500">điểm</div>
              </div>
              {reactionCounts.total > 0 && (
                <div className="w-full pt-2 mt-2 text-xs text-center text-gray-400 border-t border-gray-200">
                  {reactionCounts.total} phản ứng
                </div>
              )}
            </div>
          </ReactionTooltip>
        ) : (
          <>
            <ReactionTooltip reactions={comment.reactions}>
              <div className="particle-container">
                <button
                  onClick={() => likeMut.mutate()}
                  className={`p-1 sm:p-1 rounded-full transition-all duration-200 hover:scale-110 relative ${
                    localReaction === "like"
                      ? "text-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200"
                      : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                  } ${isLikeAnimating ? "like-animation" : ""}`}
                  disabled={likeMut.status === "pending" || !currentUserId}
                  title={
                    !currentUserId
                      ? "Đăng nhập để like"
                      : localReaction === "like"
                      ? "Bỏ like"
                      : "Like comment"
                  }
                >
                  {localReaction === "like" ? (
                    <ChevronUpSolid
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        isLikeAnimating ? "heart-animation" : ""
                      }`}
                    />
                  ) : (
                    <ChevronUpIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                  {localReaction === "like" && (
                    <div className="absolute w-2 h-2 bg-orange-500 border-2 border-white rounded-full sm:w-3 sm:h-3 -top-1 -right-1 animate-pulse"></div>
                  )}
                </button>

                {/* Particle effects */}
                {showParticles && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="particle"
                        style={{
                          left: `${50 + (Math.random() - 0.5) * 60}%`,
                          top: `${50 + (Math.random() - 0.5) * 60}%`,
                          animationDelay: `${Math.random() * 0.3}s`,
                          background: i % 2 === 0 ? "#f97316" : "#fbbf24",
                        }}
                      />
                    ))}
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`heart-${i}`}
                        className="particle heart"
                        style={{
                          left: `${50 + (Math.random() - 0.5) * 80}%`,
                          top: `${50 + (Math.random() - 0.5) * 80}%`,
                          animationDelay: `${Math.random() * 0.5}s`,
                        }}
                      >
                        ❤️
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ReactionTooltip>

            <span
              className={`text-xs sm:text-sm font-bold py-1 transition-colors duration-200 min-w-[24px] text-center tabular-nums ${
                localReaction === "like"
                  ? "text-orange-500"
                  : localReaction === "dislike"
                  ? "text-blue-500"
                  : "text-gray-700"
              }`}
            >
              {localLikes - localDislikes}
            </span>

            <ReactionTooltip reactions={comment.reactions}>
              <button
                onClick={() => dislikeMut.mutate()}
                className={`p-1 sm:p-1 rounded-full transition-all duration-200 hover:scale-110 relative ${
                  localReaction === "dislike"
                    ? "text-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                    : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                } ${isDislikeAnimating ? "dislike-animation" : ""}`}
                disabled={dislikeMut.status === "pending" || !currentUserId}
                title={
                  !currentUserId
                    ? "Đăng nhập để dislike"
                    : localReaction === "dislike"
                    ? "Bỏ dislike"
                    : "Dislike comment"
                }
              >
                {localReaction === "dislike" ? (
                  <ChevronDownSolid className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {localReaction === "dislike" && (
                  <div className="absolute w-2 h-2 bg-blue-500 border-2 border-white rounded-full sm:w-3 sm:h-3 -top-1 -right-1 animate-pulse"></div>
                )}
              </button>
            </ReactionTooltip>
          </>
        )}
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Header với Avatar và Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex items-center mr-2">
              {comment.avatar ? (
                <img
                  src={comment.avatar}
                  alt={comment.username}
                  className="object-cover w-5 h-5 mr-2 rounded-full sm:w-6 sm:h-6 ring-1 ring-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <img
                  src={images.avatarDemo}
                  alt=""
                  className="object-cover w-5 h-5 mr-2 rounded-full sm:w-6 sm:h-6 ring-1 ring-gray-200"
                />
              )}
              <span className="text-xs font-semibold text-gray-900 truncate sm:text-sm">
                {comment.username}
              </span>
              {comment.admin === 1 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                  Admin
                </span>
              )}
              {isOwner && (
                <span className="ml-1 sm:ml-2 px-1.5 py-0.5 text-xs rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  You
                </span>
              )}
              {hasReacted && !isOwner && (
                <span
                  className={`ml-1 sm:ml-2 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                    localReaction === "like"
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {localReaction === "like" ? "👍" : "👎"}
                </span>
              )}
            </div>
          </div>

          {/* Time and Action Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(comment.created_at).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {comment.updated_at !== comment.created_at && (
                <span className="ml-1 text-gray-400">(sửa)</span>
              )}
            </span>

            {/* Comment Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onToggleCollapse(comment.id)}
                className="p-1 text-gray-400 transition-colors rounded hover:text-gray-600"
                title="Thu gọn comment"
              >
                <ChevronUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => onToggleHide(comment.id)}
                className="p-1 text-gray-400 transition-colors rounded hover:text-red-500"
                title="Ẩn comment"
              >
                <EyeSlashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              className="w-full p-2 transition-colors border-2 border-blue-200 rounded-lg resize-none sm:p-3 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Chỉnh sửa bình luận..."
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {editText.length}/1000 ký tự
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 text-xs sm:text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={!editText.trim() || editMut.status === "pending"}
                  onClick={handleSave}
                >
                  {editMut.status === "pending" ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                  onClick={handleEdit}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mb-3 text-xs leading-relaxed text-gray-800 break-words whitespace-pre-wrap sm:text-sm">
            {comment.content}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center mb-2 space-x-3 text-xs text-gray-500 sm:space-x-4">
          <button
            className="flex items-center p-1 transition-colors rounded hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            onClick={handleReply}
            disabled={!currentUserId}
          >
            <ChatBubbleLeftIcon className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {!currentUserId ? "Đăng nhập để trả lời" : "Trả lời"}
            </span>
            <span className="sm:hidden">Reply</span>
          </button>

          {isOwner && (
            <>
              <button
                className="flex items-center p-1 transition-colors rounded hover:text-green-600 hover:bg-green-50"
                onClick={handleEdit}
              >
                <PencilSquareIcon className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {isEditing ? "Hủy sửa" : "Sửa"}
                </span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                className="flex items-center p-1 transition-colors rounded hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleteMut.status === "pending"}
              >
                <TrashIcon className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {deleteMut.status === "pending" ? "Đang xóa..." : "Xóa"}
                </span>
                <span className="sm:hidden">Del</span>
              </button>
            </>
          )}

          {reactionCounts.total > 0 && !isOwner && (
            <span className="text-xs font-medium text-gray-400">
              {reactionCounts.total} phản ứng
            </span>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && currentUserId && (
          <div className="p-2 mt-3 border-l-4 border-blue-400 rounded-lg sm:p-3 bg-blue-50/50">
            <textarea
              rows={2}
              className="w-full p-2 transition-colors border border-gray-300 rounded-lg resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Viết trả lời..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {replyText.length}/1000 ký tự
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-xs text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={!replyText.trim() || replyMut.status === "pending"}
                  onClick={() => replyMut.mutate()}
                >
                  {replyMut.status === "pending" ? "Đang gửi..." : "Gửi"}
                </button>
                <button
                  className="px-3 py-1 text-xs text-gray-600 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                  onClick={handleCancelReply}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Child Replies */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-2 space-y-2 sm:mt-4">
            {comment.children.map((child: Comment) => (
              <RedditComment
                key={child.id}
                comment={child}
                postId={postId}
                level={level + 1}
                commentState={commentState}
                onToggleCollapse={onToggleCollapse}
                onToggleHide={onToggleHide}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Comment Controls Component
const CommentControls: React.FC<{
  commentState: CommentState;
  onStateChange: (newState: Partial<CommentState>) => void;
  totalComments: number;
  currentUserId: number | null;
}> = ({ commentState, onStateChange, totalComments, currentUserId }) => {
  return (
    <div className="p-4 mb-4 border rounded-lg bg-gray-50">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Sort Options */}
        <div className="flex flex-wrap items-center gap-2">
          <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sắp xếp:</span>
          <select
            value={commentState.sortBy}
            onChange={(e) =>
              onStateChange({ sortBy: e.target.value as SortOption })
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="most_liked">Nhiều like nhất</option>
            <option value="most_discussed">Nhiều thảo luận nhất</option>
          </select>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Lọc:</span>
          <select
            value={commentState.filterBy}
            onChange={(e) =>
              onStateChange({ filterBy: e.target.value as FilterOption })
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!currentUserId}
          >
            <option value="all">Tất cả ({totalComments})</option>
            {currentUserId && (
              <>
                <option value="my_comments">Của tôi</option>
                <option value="replies_to_me">Trả lời tôi</option>
              </>
            )}
          </select>
        </div>

        {/* Reset buttons */}
        <div className="flex items-center gap-2">
          {(commentState.collapsed.size > 0 ||
            commentState.hidden.size > 0) && (
            <>
              {commentState.collapsed.size > 0 && (
                <button
                  onClick={() => onStateChange({ collapsed: new Set() })}
                  className="text-xs text-blue-600 transition-colors hover:text-blue-800"
                >
                  Mở rộng tất cả ({commentState.collapsed.size})
                </button>
              )}
              {commentState.hidden.size > 0 && (
                <button
                  onClick={() => onStateChange({ hidden: new Set() })}
                  className="text-xs text-green-600 transition-colors hover:text-green-800"
                >
                  Hiện tất cả ({commentState.hidden.size})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function để convert children thành replies
function convertChildrenToReplies(comment: Comment): Comment {
  const { children, ...rest } = comment;
  return {
    ...rest,
    children: children ? children.map(convertChildrenToReplies) : [],
  };
}

// Helper function để sort comments
function sortComments(comments: Comment[], sortBy: SortOption): Comment[] {
  return [...comments].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "most_liked":
        return parseInt(b.likes) - parseInt(a.likes);
      case "most_discussed":
        return (b.children?.length || 0) - (a.children?.length || 0);
      default:
        return 0;
    }
  });
}

// Helper function để filter comments
function filterComments(
  comments: Comment[],
  filterBy: FilterOption,
  currentUserId: number | null
): Comment[] {
  switch (filterBy) {
    case "my_comments":
      return comments.filter((comment) => comment.user_id === currentUserId);
    case "replies_to_me":
      return comments.filter((comment) =>
        comment.children?.some((child) => child.user_id === currentUserId)
      );
    case "all":
    default:
      return comments;
  }
}

// Main CommentPost Component
const CommentPost: React.FC<Props> = ({ postId }) => {
  const qc = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const currentUserInfo = useSelector((state: RootState) => state.user);
  const currentUserId = getCurrentUserId();

  // Comment state management
  const [commentState, setCommentState] = useState<CommentState>({
    collapsed: new Set(),
    hidden: new Set(),
    sortBy: "newest",
    filterBy: "all",
    currentPage: 1,
    commentsPerPage: 20,
  });

  // Fetch comments
  const {
    data: rawComments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getCommentsOfPost(postId),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
    retry: 3,
  });

  // Process comments
  const processedComments = useMemo(() => {
    let comments = rawComments.map(convertChildrenToReplies);

    // Filter
    comments = filterComments(comments, commentState.filterBy, currentUserId);

    // Sort
    comments = sortComments(comments, commentState.sortBy);

    return comments;
  }, [rawComments, commentState.filterBy, commentState.sortBy, currentUserId]);

  // Pagination
  const paginatedComments = useMemo(() => {
    const startIndex =
      (commentState.currentPage - 1) * commentState.commentsPerPage;
    const endIndex = startIndex + commentState.commentsPerPage;
    return processedComments.slice(startIndex, endIndex);
  }, [
    processedComments,
    commentState.currentPage,
    commentState.commentsPerPage,
  ]);

  const totalPages = Math.ceil(
    processedComments.length / commentState.commentsPerPage
  );

  // State update functions
  const updateCommentState = useCallback((newState: Partial<CommentState>) => {
    setCommentState((prev) => ({ ...prev, ...newState }));
  }, []);

  const toggleCollapse = useCallback((commentId: number) => {
    setCommentState((prev) => {
      const newCollapsed = new Set(prev.collapsed);
      if (newCollapsed.has(commentId)) {
        newCollapsed.delete(commentId);
      } else {
        newCollapsed.add(commentId);
      }
      return { ...prev, collapsed: newCollapsed };
    });
  }, []);

  const toggleHide = useCallback((commentId: number) => {
    setCommentState((prev) => {
      const newHidden = new Set(prev.hidden);
      if (newHidden.has(commentId)) {
        newHidden.delete(commentId);
      } else {
        newHidden.add(commentId);
      }
      return { ...prev, hidden: newHidden };
    });
  }, []);

  // Post comment mutation
  const postMut = useMutation({
    mutationFn: () => commentPost(postId, { content: newComment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      setNewComment("");
    },
    onError: (error) => {
      console.error("Error posting comment:", error);
      alert("Có lỗi xảy ra khi đăng bình luận. Vui lòng thử lại!");
    },
  });

  const handleSubmitComment = () => {
    if (!currentUserInfo) {
      alert("Vui lòng đăng nhập để bình luận!");
      return;
    }

    if (!newComment.trim()) {
      alert("Vui lòng nhập nội dung bình luận!");
      return;
    }

    postMut.mutate();
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mt-6 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">
          Có lỗi xảy ra khi tải bình luận. Vui lòng thử lại!
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 mt-2 text-sm text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* New comment input */}
      <div className="p-4 mb-6 bg-white border rounded-lg shadow-sm">
        <div className="flex items-start space-x-3">
          {currentUserInfo.avatar ? (
            <img
              src={currentUserInfo.avatar}
              alt="Avatar"
              className="w-8 h-8 mt-1 rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-8 h-8 mt-1 text-gray-400" />
          )}
          <div className="flex-1">
            <textarea
              id="commentInput"
              rows={4}
              className="w-full p-4 transition-colors border-2 border-gray-200 rounded-lg resize-none focus:border-orange-400 focus:outline-none"
              placeholder={
                currentUserInfo
                  ? "Chia sẻ suy nghĩ của bạn..."
                  : "Đăng nhập để bình luận..."
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!currentUserInfo}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">
                {newComment.length}/1000 ký tự
              </span>
              <button
                className="px-6 py-2 text-white transition-all duration-200 transform rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                disabled={
                  !newComment.trim() ||
                  postMut.status === "pending" ||
                  !currentUserInfo
                }
                onClick={handleSubmitComment}
              >
                {postMut.status === "pending" ? (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang đăng...
                  </span>
                ) : !currentUserInfo ? (
                  "Đăng nhập để bình luận"
                ) : (
                  "Bình luận"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Controls */}
      {processedComments.length > 0 && (
        <CommentControls
          commentState={commentState}
          onStateChange={updateCommentState}
          totalComments={processedComments.length}
          currentUserId={currentUserId}
        />
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {processedComments.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bình luận ({processedComments.length})
              </h3>
              <button
                onClick={() => refetch()}
                className="text-sm text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>

            {paginatedComments.map((comment: Comment) => (
              <RedditComment
                key={comment.id}
                comment={comment}
                postId={postId}
                commentState={commentState}
                onToggleCollapse={toggleCollapse}
                onToggleHide={toggleHide}
                currentUserId={currentUserId}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 space-x-2">
                <button
                  onClick={() =>
                    updateCommentState({
                      currentPage: commentState.currentPage - 1,
                    })
                  }
                  disabled={commentState.currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
                  Trang {commentState.currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    updateCommentState({
                      currentPage: commentState.currentPage + 1,
                    })
                  }
                  disabled={commentState.currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Chưa có bình luận nào
            </h3>
            <p className="text-gray-500">
              {currentUserInfo
                ? "Hãy là người đầu tiên bình luận về bài viết này!"
                : "Đăng nhập để trở thành người đầu tiên bình luận!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentPost;
