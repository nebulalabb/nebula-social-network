"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Plus, Heart, MessageCircle, Download, Loader2, Search, X } from "lucide-react";
import { useAuthStore } from "../../../store/use-auth-store";
import apiClient from "../../../lib/api-client";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const SORT_OPTIONS = [
  { value: "new", label: "Mới nhất" },
  { value: "hot", label: "Hot nhất" },
];

export default function FanartPage() {
  const { user } = useAuthStore();
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const qc = useQueryClient();

  // Fanart là posts có media type IMAGE và tag fanart
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["fanart", sort, search],
    queryFn: async ({ pageParam }) => {
      const params: any = { limit: 20, type: "fanart", sort };
      if (pageParam) params.cursor = pageParam;
      if (search) params.q = search;
      const { data } = await apiClient.get("/posts/explore", { params });
      return data.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last?.nextCursor ?? undefined,
  });

  const allPosts = data?.pages.flatMap((p) => p?.posts || []) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image size={24} />
            <div>
              <h1 className="text-xl font-bold">Fanart Gallery</h1>
              <p className="text-purple-200 text-sm">Tác phẩm từ cộng đồng</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={16} /> Đăng fanart
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo series, nhân vật..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                  sort === opt.value
                    ? "bg-pink-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-pink-600" size={24} />
        </div>
      ) : allPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Image size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có fanart nào. Hãy là người đầu tiên đăng!</p>
        </div>
      ) : (
        <>
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {allPosts.map((post: any) => (
              <FanartCard key={post._id} post={post} />
            ))}
          </div>
          <div className="flex justify-center py-4">
            {isFetchingNextPage ? (
              <Loader2 className="animate-spin text-pink-600" size={20} />
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Xem thêm
              </button>
            ) : (
              <p className="text-xs text-slate-400">Đã xem hết</p>
            )}
          </div>
        </>
      )}

      {showUpload && (
        <UploadFanartModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); qc.invalidateQueries({ queryKey: ["fanart"] }); }}
        />
      )}
    </div>
  );
}

function FanartCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(!!post.userReaction);
  const [likeCount, setLikeCount] = useState(post.engagement?.reactionCount || 0);

  const handleLike = async () => {
    try {
      if (liked) {
        await apiClient.delete(`/posts/${post._id}/react`);
        setLikeCount((c: number) => c - 1);
      } else {
        await apiClient.post(`/posts/${post._id}/react`, { type: "LOVE" });
        setLikeCount((c: number) => c + 1);
      }
      setLiked(!liked);
    } catch {}
  };

  const firstImage = post.media?.find((m: any) => m.type === "IMAGE");
  if (!firstImage) return null;

  return (
    <div className="break-inside-avoid mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={firstImage.url}
          alt={post.content}
          className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {post.hasSpoiler && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white text-sm font-medium">Spoiler</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors",
                liked ? "text-red-400" : "text-white"
              )}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              {likeCount}
            </button>
            <Link
              href={`/feed`}
              className="flex items-center gap-1.5 text-white text-sm"
            >
              <MessageCircle size={16} />
              {post.engagement?.commentCount || 0}
            </Link>
          </div>
        </div>
      </div>
      <div className="p-3">
        <Link href={`/profile/${post.author?.username}`} className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
            {post.author?.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-[10px] font-bold">{(post.author?.username || "?")[0].toUpperCase()}</span>
            )}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 hover:text-pink-600 transition-colors truncate">
            {post.author?.displayName || post.author?.username}
          </span>
        </Link>
        {post.content && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{post.content}</p>
        )}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.hashtags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[10px] text-pink-500">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadFanartModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("fanart");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return toast.error("Vui lòng nhập URL ảnh");
    setLoading(true);
    try {
      await apiClient.post("/posts", {
        content,
        media: [{ type: "IMAGE", url: imageUrl }],
        hashtags: hashtags.split(",").map((t) => t.trim()).filter(Boolean),
        visibility: "PUBLIC",
      });
      toast.success("Đã đăng fanart");
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi đăng fanart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đăng Fanart</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">URL ảnh *</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 w-full max-h-40 object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mô tả</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả về fanart..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Hashtags (cách nhau bằng dấu phẩy)</label>
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="fanart, naruto, ..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Đang đăng..." : "Đăng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
