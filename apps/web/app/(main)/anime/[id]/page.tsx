"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Star, Play, Loader2, ChevronDown, ChevronUp, Plus, Check,
  Share2, Users, MessageSquare, Heart, BookmarkPlus, Tv, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import apiClient from "../../../../lib/api-client";
import { AnimeCard } from "../../../../components/profile/anime-card";
import { ReviewSection } from "../../../../components/anime/review-section";
import { useAuthStore } from "../../../../store/use-auth-store";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";

const TABS = ["Tổng quan", "Nhân vật", "Cộng đồng", "Review", "Đề xuất"] as const;
type Tab = (typeof TABS)[number];

const STATUS_MAP: Record<string, string> = {
  "Finished Airing": "Đã kết thúc",
  "Currently Airing": "Đang chiếu",
  "Not yet aired": "Chưa chiếu",
};

const SEASON_MAP: Record<string, string> = {
  spring: "Xuân", summer: "Hè", fall: "Thu", winter: "Đông",
};

const LIST_OPTIONS = [
  { value: "WATCHING", label: "Đang xem", color: "text-blue-600" },
  { value: "COMPLETED", label: "Đã xem", color: "text-green-600" },
  { value: "PLAN_TO_WATCH", label: "Dự định xem", color: "text-purple-600" },
  { value: "ON_HOLD", label: "Tạm dừng", color: "text-yellow-600" },
  { value: "DROPPED", label: "Bỏ dở", color: "text-red-600" },
];

export default function AnimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Tổng quan");
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);

  const { data: anime, isLoading } = useQuery({
    queryKey: ["anime-detail", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/anime/${id}`);
      return data.data;
    },
  });

  const { data: myEntry } = useQuery({
    queryKey: ["anime-list-entry", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/anime/me/list`);
      return (data.data || []).find((e: any) => String(e.animeId) === String(id)) || null;
    },
    enabled: !!user,
  });

  const { data: characters } = useQuery({
    queryKey: ["anime-characters", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/anime/${id}/characters`);
      return data.data;
    },
    enabled: activeTab === "Nhân vật",
  });

  const { data: communityPosts } = useQuery({
    queryKey: ["anime-community-posts", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/posts/explore`, {
        params: { hashtag: anime?.title?.toLowerCase().replace(/\s+/g, ""), limit: 10 },
      });
      return data.data?.posts || [];
    },
    enabled: activeTab === "Cộng đồng" && !!anime,
  });

  const listMutation = useMutation({
    mutationFn: (status: string) => apiClient.put(`/anime/list/${id}`, { status }),
    onSuccess: () => {
      toast.success("Đã cập nhật danh sách");
      qc.invalidateQueries({ queryKey: ["anime-list-entry", id] });
      qc.invalidateQueries({ queryKey: ["my-anime-list"] });
      setShowListMenu(false);
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiClient.delete(`/anime/list/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa khỏi danh sách");
      qc.invalidateQueries({ queryKey: ["anime-list-entry", id] });
      setShowListMenu(false);
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: anime?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link");
    }
  };

  const handleSharePost = async () => {
    try {
      await apiClient.post("/posts", {
        content: `Tôi đang xem ${anime?.title_english || anime?.title}! Anime này thật tuyệt vời 🎌 #anime #${(anime?.title || "").replace(/\s+/g, "")}`,
        visibility: "PUBLIC",
        hashtags: ["anime", (anime?.title || "").toLowerCase().replace(/\s+/g, "")],
      });
      toast.success("Đã chia sẻ lên feed!");
    } catch {
      toast.error("Lỗi chia sẻ");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" size={32} /></div>;
  }
  if (!anime) return <div className="text-center py-20 text-slate-500">Không tìm thấy anime</div>;

  const synopsis = anime.synopsis || "";
  const currentStatus = myEntry?.status;
  const currentStatusLabel = LIST_OPTIONS.find((o) => o.value === currentStatus)?.label;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        {anime.trailer?.images?.maximum_image_url && (
          <div className="h-48 overflow-hidden relative">
            <img src={anime.trailer.images.maximum_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
          </div>
        )}

        <div className="p-4 flex gap-4">
          {/* Poster */}
          <div className={cn(
            "w-32 shrink-0 rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-900",
            anime.trailer?.images?.maximum_image_url && "-mt-16 relative z-10"
          )}>
            <img
              src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}
              alt={anime.title}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {anime.title_english || anime.title}
            </h1>
            {anime.title !== anime.title_english && (
              <p className="text-sm text-slate-500 mt-0.5">{anime.title}</p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {anime.score && (
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star size={16} fill="currentColor" />
                  <span>{anime.score}</span>
                  {anime.scored_by && <span className="text-xs text-slate-400 font-normal">({(anime.scored_by / 1000).toFixed(0)}K)</span>}
                </div>
              )}
              {anime.type && (
                <span className="text-xs bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-medium">
                  {anime.type}
                </span>
              )}
              {anime.status && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  anime.status === "Currently Airing"
                    ? "bg-green-100 dark:bg-green-950/30 text-green-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {STATUS_MAP[anime.status] || anime.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {anime.genres?.slice(0, 5).map((g: any) => (
                <Link
                  key={g.mal_id}
                  href={`/explore?tag=${g.name}`}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full hover:bg-pink-100 dark:hover:bg-pink-950/30 hover:text-pink-600 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Add to list */}
              <div className="relative">
                <button
                  onClick={() => setShowListMenu(!showListMenu)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                    currentStatus
                      ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                      : "bg-pink-600 hover:bg-pink-700 text-white"
                  )}
                >
                  {currentStatus ? <Check size={13} /> : <Plus size={13} />}
                  {currentStatusLabel || "Thêm vào danh sách"}
                </button>
                {showListMenu && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    {LIST_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => listMutation.mutate(opt.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                          currentStatus === opt.value ? "font-semibold" : "",
                          opt.color
                        )}
                      >
                        {currentStatus === opt.value && "✓ "}{opt.label}
                      </button>
                    ))}
                    {currentStatus && (
                      <button
                        onClick={() => removeMutation.mutate()}
                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-slate-100 dark:border-slate-700 transition-colors"
                      >
                        Xóa khỏi danh sách
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Share to feed */}
              <button
                onClick={handleSharePost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:text-pink-600 transition-colors"
              >
                <MessageSquare size={13} /> Chia sẻ lên feed
              </button>

              {/* Watch party */}
              <Link
                href={`/room/my?anime=${id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-950/50 transition-colors"
              >
                <Users size={13} /> Watch Party
              </Link>

              {/* Copy link */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Share2 size={13} /> Chia sẻ
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800">
          {[
            { label: "Tập", value: anime.episodes || "?" },
            { label: "Mùa", value: anime.season ? `${SEASON_MAP[anime.season] || anime.season} ${anime.year}` : anime.year || "?" },
            { label: "Thời lượng", value: anime.duration?.replace(" per ep", "") || "?" },
            { label: "Xếp hạng", value: anime.rank ? `#${anime.rank}` : "?" },
          ].map(({ label, value }) => (
            <div key={label} className="py-3 text-center border-r last:border-r-0 border-slate-100 dark:border-slate-800">
              <p className="font-bold text-sm text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex-1 min-w-fit py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === t
                  ? "text-pink-600 border-b-2 border-pink-600"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "Tổng quan" && (
            <div className="space-y-4">
              {synopsis && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Nội dung</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {synopsisExpanded ? synopsis : synopsis.slice(0, 300)}
                    {synopsis.length > 300 && (
                      <button
                        onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                        className="ml-1 text-pink-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        {synopsisExpanded ? <><ChevronUp size={14} /> Thu gọn</> : <><ChevronDown size={14} /> Xem thêm</>}
                      </button>
                    )}
                  </p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {anime.studios?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Studio</p>
                    <div className="flex flex-wrap gap-1">
                      {anime.studios.map((s: any) => (
                        <span key={s.mal_id} className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs">{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {anime.source && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Nguồn gốc</p>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">{anime.source}</p>
                  </div>
                )}
                {anime.rating && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Phân loại</p>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">{anime.rating}</p>
                  </div>
                )}
                {anime.popularity && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Độ phổ biến</p>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">#{anime.popularity}</p>
                  </div>
                )}
              </div>

              {/* Themes */}
              {(anime.themes?.length > 0 || anime.demographics?.length > 0) && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Chủ đề & Đối tượng</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...(anime.themes || []), ...(anime.demographics || [])].map((t: any) => (
                      <span key={t.mal_id} className="text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trailer */}
              {anime.trailer?.embed_url && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Play size={16} /> Trailer
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <iframe src={anime.trailer.embed_url} className="w-full h-full" allowFullScreen title="Trailer" />
                  </div>
                </div>
              )}

              {/* External links */}
              <div className="flex gap-2 flex-wrap">
                <a
                  href={`https://myanimelist.net/anime/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink size={12} /> MyAnimeList
                </a>
              </div>
            </div>
          )}

          {activeTab === "Nhân vật" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {characters?.slice(0, 18).map((c: any) => (
                <div key={c.character.mal_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <img src={c.character.images?.jpg?.image_url} alt={c.character.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.character.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.role}</p>
                    {c.voice_actors?.[0] && (
                      <p className="text-xs text-slate-400 truncate">{c.voice_actors[0].person?.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Cộng đồng" && (
            <div className="space-y-4">
              {/* Share prompt */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Chia sẻ cảm nhận của bạn</p>
                  <p className="text-xs text-slate-500 mt-0.5">Đăng bài về {anime.title_english || anime.title}</p>
                </div>
                <button
                  onClick={handleSharePost}
                  className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  <MessageSquare size={13} /> Đăng ngay
                </button>
              </div>

              {/* Community posts */}
              {communityPosts?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Tv size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Chưa có bài đăng nào về anime này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communityPosts?.map((post: any) => (
                    <div key={post._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-pink-200 dark:hover:border-pink-800 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
                          {post.author?.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-xs font-bold">{(post.author?.username || "?")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <Link href={`/profile/${post.author?.username}`} className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-pink-600">
                          {post.author?.displayName || post.author?.username}
                        </Link>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Heart size={11} /> {post.engagement?.reactionCount || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.engagement?.commentCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Review" && (
            <ReviewSection entityType="ANIME" entityId={id} />
          )}

          {activeTab === "Đề xuất" && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {anime.recommendations?.slice(0, 12).map((r: any) => (
                <AnimeCard
                  key={r.entry.mal_id}
                  id={r.entry.mal_id}
                  title={r.entry.title}
                  imageUrl={r.entry.images?.jpg?.image_url}
                  size="sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
