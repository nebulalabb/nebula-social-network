"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Heart, Eye, Clock, Tag, Loader2, Search, X, PenLine } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "../../../store/use-auth-store";
import apiClient from "../../../lib/api-client";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

const GENRES = ["Romance", "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Sci-Fi", "Slice of Life"];
const SORT_OPTIONS = [{ value: "new", label: "Mới nhất" }, { value: "popular", label: "Phổ biến" }];

export default function FanficPage() {
  const { user } = useAuthStore();
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  // Fanfic dùng posts với hashtag fanfic
  const { data: posts, isLoading } = useQuery({
    queryKey: ["fanfic", sort, search, selectedGenre],
    queryFn: async () => {
      const params: any = { limit: 20, sort };
      if (search) params.q = search;
      if (selectedGenre) params.hashtag = selectedGenre.toLowerCase();
      else params.hashtag = "fanfic";
      const { data } = await apiClient.get("/posts/explore", { params });
      return data.data?.posts || [];
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine size={24} />
            <div>
              <h1 className="text-xl font-bold">Fanfiction</h1>
              <p className="text-indigo-200 text-sm">Sáng tác từ cộng đồng</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={16} /> Viết fanfic
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm fanfic..."
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
                  sort === opt.value ? "bg-pink-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGenre("")}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors", !selectedGenre ? "bg-pink-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}
          >
            Tất cả
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g === selectedGenre ? "" : g)}
              className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors", selectedGenre === g ? "bg-pink-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Fanfic list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
      ) : posts?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có fanfic nào. Hãy là người đầu tiên viết!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <FanficCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateFanficModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["fanfic"] }); }}
        />
      )}
    </div>
  );
}

function FanficCard({ post }: { post: any }) {
  const wordCount = post.content?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-pink-300 dark:hover:border-pink-800 transition-colors">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.author?.username}`} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center">
            {post.author?.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">{(post.author?.username || "?")[0].toUpperCase()}</span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/profile/${post.author?.username}`} className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-pink-600 transition-colors">
              {post.author?.displayName || post.author?.username}
            </Link>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
            </span>
          </div>

          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed line-clamp-4 mb-3">
            {post.content}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={12} /> {readTime} phút đọc</span>
            <span className="flex items-center gap-1"><Heart size={12} /> {post.engagement?.reactionCount || 0}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {post.engagement?.commentCount || 0} bình luận</span>
          </div>

          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.hashtags.map((tag: string) => (
                <span key={tag} className="text-xs text-pink-500 bg-pink-50 dark:bg-pink-950/20 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateFanficModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("fanfic");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Vui lòng nhập nội dung");
    setLoading(true);
    try {
      await apiClient.post("/posts", {
        content,
        hashtags: hashtags.split(",").map((t) => t.trim()).filter(Boolean),
        visibility: "PUBLIC",
      });
      toast.success("Đã đăng fanfic");
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Viết Fanfic</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nội dung *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết fanfic của bạn ở đây..."
              rows={12}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              required
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{content.split(/\s+/).filter(Boolean).length} từ</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tags (cách nhau bằng dấu phẩy)</label>
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="fanfic, romance, naruto, ..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Đang đăng..." : "Đăng fanfic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
