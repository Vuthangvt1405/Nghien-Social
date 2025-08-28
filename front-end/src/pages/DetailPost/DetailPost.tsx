import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { dislikePost, getDataPostBySlug, likePost } from "../../api/Post";
import Layout from "../../components/Layout";
import DOMPurify from "dompurify";
import "./DetailPost.css";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import OverlayLocked from "./OverlayLocked";
import { useState, useEffect, useMemo, useCallback } from "react";
import { decryptAES } from "../../utils/Crypto";
import toast, { Toaster } from "react-hot-toast";
import { shortenWithTinyUrl } from "../../utils/shortenWithTinyUrl";
import CommentPost from "../../components/CommentPost/CommentPost";

// Type definitions remain the same...
interface PostData {
  id: number;
  ownerId: number;
  title: string;
  caption: string;
  content: string;
  slug: string;
  cover: string;
  isLocked: number;
  created_at: string;
  updated_at: string;
  owner: string;
  react?: number;
  email: string;
  avatar: string | null;
  admin: number;
  total_likes: number;
  total_dislikes: number;
}

interface ApiResponse {
  data: PostData;
}

const DetailPost = () => {
  const params = useParams();
  const slug = params["slug"];
  const [passwordPost, setPasswordPost] = useState("");
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Reset states when slug changes
  useEffect(() => {
    setPasswordPost("");
    setDecryptedContent(null);
    setIsUnlocked(false);
    setIsDecrypting(false);
  }, [slug]);

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryFn: () => getDataPostBySlug(slug as string),
    queryKey: ["posts", slug],
    enabled: !!slug,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
    staleTime: 2000,
  });

  // Helper functions remain the same...
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return "Unknown time";
    }
  };

  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "blockquote",
        "code",
        "pre",
        "span",
        "div",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "class", "style"],
      ALLOW_DATA_ATTR: false,
    });
  };

  const handleShare = async () => {
    try {
      const input = window.location.href;
      const short = await shortenWithTinyUrl(input);
      await navigator.clipboard.writeText(short);
      toast.success("Rút gọn thành công và đã sao chép vào clipboard!");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        toast.error(`Lỗi: ${(err as { message: string }).message}`);
      } else {
        toast.error("Đã xảy ra lỗi không xác định khi rút gọn link.");
      }
    }
  };

  // const handleSendComment = async () => {
  //   if (!commentData.trim()) {
  //     toast.error("❌ Bình luận không được để trống.");
  //     return;
  //   }
  //   if (!slug) {
  //     toast.error("❌ Không tìm thấy bài viết để bình luận.");
  //     return;
  //   }
  //   try {
  //     await commentPost(post.id, { content: commentData });
  //     setCommentData("");
  //     toast.success("✅ Bình luận đã được gửi thành công!");
  //   } catch (error) {
  //     console.error("Lỗi gửi bình luận:", error);
  //     toast.error("❌ Có lỗi xảy ra khi gửi bình luận.");
  //   }
  // };

  const getAvatarUrl = (avatar: string | null, email: string) => {
    if (avatar && avatar !== "null" && avatar !== "0") {
      return avatar;
    }
    const emailHash = btoa(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=40`;
  };

  const getNetScore = (likes: number, dislikes: number) => {
    const score = likes - dislikes;
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const onSubmitPassword = async () => {
    if (!data?.data) return false;

    setIsDecrypting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const decrypted = decryptAES(data.data.content, passwordPost);

      if (!decrypted || decrypted.trim() === "") {
        return false;
      }

      setDecryptedContent(decrypted);
      setIsUnlocked(true);
      toast.success("✅ Giải mã thành công! Nội dung đã được ghi đè.");
      return true;
    } catch (error) {
      console.error("Lỗi giải mã:", error);
      toast.error("❌ Có lỗi xảy ra khi giải mã.");
      return false;
    } finally {
      setIsDecrypting(false);
    }
  };

  // Tạo computed post data với content đã được giải mã
  const processedPost = useMemo(() => {
    if (!data?.data) return null;

    return {
      ...data.data,
      content: decryptedContent || data.data.content,
      isLocked: isUnlocked ? 0 : data.data.isLocked,
    };
  }, [data?.data, decryptedContent, isUnlocked]);

  // Xử lý khi có data mới và cần kiểm tra xem có cần giải mã lại không
  const handleDataRefresh = useCallback(() => {
    if (decryptedContent && passwordPost && data?.data) {
      const newDecrypted = decryptAES(data.data.content, passwordPost);
      if (newDecrypted && newDecrypted.trim() !== "") {
        setDecryptedContent(newDecrypted);
      } else {
        setDecryptedContent(null);
        setIsUnlocked(false);
      }
    }
  }, [decryptedContent, passwordPost, data?.data]);

  // Trigger khi data thay đổi để tự động cập nhật nếu cần
  useEffect(() => {
    if (data?.data && isUnlocked && passwordPost) {
      handleDataRefresh();
    }
  }, [
    data?.data,
    data?.data?.content,
    data?.data?.updated_at,
    isUnlocked,
    handleDataRefresh,
    passwordPost,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-b-2 border-orange-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !data?.data) {
    return (
      <Layout>
        <div className="container max-w-4xl px-4 py-8 mx-auto">
          <div className="p-6 text-center border border-red-200 rounded-lg bg-red-50">
            <h2 className="mb-2 text-xl font-semibold text-red-800">
              Không tìm thấy bài viết
            </h2>
            <p className="text-red-600">
              Bài viết có thể đã bị xóa hoặc không tồn tại.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Locked post overlay
  if (data.data.isLocked === 1 && !isUnlocked) {
    return (
      <OverlayLocked
        value={passwordPost}
        setPasswordPost={setPasswordPost}
        onSubmit={onSubmitPassword}
        isLoading={isDecrypting}
      />
    );
  }

  const post = processedPost!;
  console.log(post);
  const isPostLocked = post.isLocked === 1;
  const isAdmin = post.admin === 1;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Container với responsive width */}
        <div className="container px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-6">
          {/* Debug info - responsive */}
          {isUnlocked && decryptedContent && (
            <div className="p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
              <p className="text-xs text-green-700 sm:text-sm">
                ✅ Đang hiển thị nội dung đã giải mã
                {data?.data?.content !== decryptedContent &&
                  " (đã giải mã để xem nội dung)"}
              </p>
            </div>
          )}

          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 lg:gap-6">
            {/* Main Content - Takes full width on mobile, adjusts on larger screens */}
            <div className="xl:col-span-9">
              {/* Post Card */}
              <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Post Header */}
                <div className="p-4 border-b border-gray-100 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={getAvatarUrl(post.avatar, post.email)}
                      alt={`${post.owner} avatar`}
                      className="flex-shrink-0 object-cover w-8 h-8 border border-gray-200 rounded-full sm:w-10 sm:h-10"
                    />
                    <div className="flex flex-col min-w-0 gap-1 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-2">
                      <span className="flex items-center gap-1 font-medium text-gray-900 truncate">
                        {post.owner}
                        {isAdmin && (
                          <span className="flex-shrink-0 px-2 py-1 text-xs text-red-700 bg-red-100 rounded-full">
                            Admin
                          </span>
                        )}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm">
                        {getTimeAgo(post.created_at)}
                      </span>
                      {post.updated_at !== post.created_at && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-xs">(đã chỉnh sửa)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Post Title - Responsive typography */}
                  <div className="flex items-start gap-2">
                    <h1 className="flex-1 text-lg font-semibold leading-tight text-gray-900 break-words sm:text-xl lg:text-2xl">
                      {post.title}
                    </h1>
                    {isPostLocked && (
                      <LockClosedIcon
                        className="flex-shrink-0 w-5 h-5 mt-1 text-red-500"
                        title="Bài viết đã bị khóa"
                      />
                    )}
                  </div>

                  {/* Caption - Responsive */}
                  {post.caption && post.caption.trim() && (
                    <p className="mt-2 text-sm italic text-gray-600 break-words sm:text-base">
                      {post.caption}
                    </p>
                  )}
                </div>

                {/* Post Content - Responsive Layout */}
                <div className="flex flex-col sm:flex-row">
                  {/* Vote Section - Enhanced with animations */}
                  <div className="relative flex items-center justify-center order-2 gap-2 px-4 py-3 border-b border-gray-200 sm:flex-col sm:gap-4 sm:px-4 sm:py-6 sm:border-b-0 sm:border-r bg-gradient-to-br from-gray-50 to-gray-100 sm:order-1 backdrop-blur-sm">
                    {/* Upvote Button */}
                    <button
                      className="relative p-2 overflow-hidden transition-all duration-300 vote-button rounded-xl sm:p-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 disabled:opacity-50 hover:shadow-lg hover:scale-110 active:scale-95 group"
                      onClick={() => likePost(post.id)}
                      disabled={isPostLocked}
                    >
                      {/* Bubble animation container */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="opacity-0 bubble-animation group-active:opacity-100"></div>
                      </div>

                      <ChevronUpIcon
                        className={`relative z-10 w-5 h-5 sm:w-7 sm:h-7 transition-all duration-300 ${
                          post.react == 1
                            ? "text-orange-600 drop-shadow-md transform scale-110"
                            : "text-gray-500 group-hover:text-orange-500 group-hover:drop-shadow-sm"
                        }`}
                      />

                      {/* Glow effect for active state */}
                      {post.react == 1 && (
                        <div className="absolute inset-0 bg-orange-400 rounded-xl opacity-20 blur-sm animate-pulse"></div>
                      )}
                    </button>

                    {/* Score Display */}
                    <div className="relative px-3 py-2 mx-1 border border-gray-200 rounded-lg shadow-inner bg-gradient-to-br from-white to-gray-50">
                      <span className="block text-sm sm:text-lg font-bold text-gray-700 min-w-[2.5rem] text-center tabular-nums">
                        {getNetScore(post.total_likes, post.total_dislikes)}
                      </span>

                      {/* Animated background for score changes */}
                      <div className="absolute inset-0 rounded-lg opacity-0 bg-gradient-to-r from-orange-200 to-purple-200 animate-score-change"></div>
                    </div>

                    {/* Downvote Button */}
                    <button
                      className="relative p-2 overflow-hidden transition-all duration-300 vote-button rounded-xl sm:p-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 disabled:opacity-50 hover:shadow-lg hover:scale-110 active:scale-95 group"
                      onClick={() => dislikePost(post.id)}
                      disabled={isPostLocked}
                    >
                      {/* Bubble animation container */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="opacity-0 bubble-animation group-active:opacity-100"></div>
                      </div>

                      <ChevronDownIcon
                        className={`relative z-10 w-5 h-5 sm:w-7 sm:h-7 transition-all duration-300 ${
                          post.react == 0
                            ? "text-purple-700 drop-shadow-md transform scale-110"
                            : "text-gray-500 group-hover:text-purple-500 group-hover:drop-shadow-sm"
                        }`}
                      />

                      {/* Glow effect for active state */}
                      {post.react == 0 && (
                        <div className="absolute inset-0 bg-purple-400 rounded-xl opacity-20 blur-sm animate-pulse"></div>
                      )}
                    </button>
                  </div>

                  {/* Content Area - Responsive */}
                  <div className="flex-1 order-1 p-4 sm:p-6 sm:order-2">
                    {/* Cover Image - Responsive */}
                    {post.cover && post.cover !== "0" && (
                      <div className="mb-4">
                        <img
                          src={post.cover}
                          alt="Post cover"
                          className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Post Content - Responsive typography */}
                    <div className="mb-6 prose-sm prose sm:prose-base lg:prose-lg max-w-none">
                      <div
                        className="leading-relaxed text-gray-800 break-words"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHTML(post.content),
                        }}
                      />
                    </div>

                    {/* Post Stats - Responsive */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-gray-500 sm:gap-4 sm:text-sm">
                      <span>{post.total_likes} likes</span>
                      <span>{post.total_dislikes} dislikes</span>
                      <span className="hidden sm:inline">ID: {post.id}</span>
                      {decryptedContent && (
                        <span className="font-medium text-green-600">
                          🔓 Đã giải mã
                        </span>
                      )}
                    </div>

                    {/* Post Actions - Responsive */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 sm:gap-4">
                      <button
                        className="flex items-center gap-2 px-2 py-2 text-gray-600 transition-colors rounded-lg sm:px-3 hover:bg-gray-100 disabled:opacity-50"
                        disabled={isPostLocked}
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <label htmlFor="commentInput">
                          <span className="text-xs font-medium sm:text-sm">
                            Bình luận
                          </span>
                        </label>
                      </button>

                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-2 py-2 text-gray-600 transition-colors rounded-lg sm:px-3 hover:bg-gray-100"
                      >
                        <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs font-medium sm:text-sm">
                          Chia sẻ
                        </span>
                      </button>

                      <button className="flex items-center gap-2 px-2 py-2 text-gray-600 transition-colors rounded-lg sm:px-3 hover:bg-gray-100">
                        <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden text-xs font-medium sm:text-sm sm:inline">
                          Lưu
                        </span>
                      </button>

                      <button className="p-2 ml-auto text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                        <EllipsisHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {/* Locked Post Notice */}
                    {isPostLocked && (
                      <div className="p-3 mt-4 border border-yellow-200 rounded-lg bg-yellow-50">
                        <p className="flex items-center gap-2 text-xs text-yellow-800 sm:text-sm">
                          <LockClosedIcon className="flex-shrink-0 w-4 h-4" />
                          <span>
                            Bài viết này đã bị khóa. Không thể bình luận hoặc
                            vote.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Section - Responsive */}
              {!isPostLocked && (
                <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:mt-6">
                  <div className="p-4 sm:p-6">
                    <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
                      Bình luận
                    </h3>
                    {/* Comments - Responsive */}
                    <CommentPost postId={post.id}></CommentPost>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Only show on xl screens, responsive */}
            <div className="xl:col-span-3">
              <div className="hidden space-y-4 xl:block xl:sticky xl:top-6">
                {/* Author Info */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Tác giả
                  </h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(post.avatar, post.email)}
                      alt={post.owner}
                      className="flex-shrink-0 object-cover w-10 h-10 border border-gray-200 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <span className="truncate">{post.owner}</span>
                        {isAdmin && (
                          <span className="flex-shrink-0 px-2 py-1 text-xs text-red-700 bg-red-100 rounded-full">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        ID: {post.ownerId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Stats */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Thống kê
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lượt thích</span>
                      <span className="font-medium text-green-600">
                        {post.total_likes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lượt không thích</span>
                      <span className="font-medium text-red-600">
                        {post.total_dislikes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Điểm tổng</span>
                      <span className="font-medium">
                        {post.total_likes - post.total_dislikes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái</span>
                      <span
                        className={`font-medium ${
                          isPostLocked ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isPostLocked ? "Đã khóa" : "Hoạt động"}
                      </span>
                    </div>
                    {decryptedContent && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã hóa</span>
                        <span className="font-medium text-green-600">
                          Đã giải mã
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </Layout>
  );
};

export default DetailPost;
