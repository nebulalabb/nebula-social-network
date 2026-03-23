"use client";

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/use-auth-store";
import { CreatePostBox } from "../../../components/feed/create-post-box";
import { PostCard } from "../../../components/feed/post-card";
import { Loader2, RefreshCw, Tv, TrendingUp, Sparkles, Plus } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { getSocket } from "../../../hooks/use-socket";
import Link from "next/link";

const TABS = ["Dành cho bạn", "Mới nhất", "Đang hot"] as const;
type Tab = (typeof TABS)[number];

const TAB_ACCENT: Record<Tab, string> = {
  "Dành cho bạn": "from-pink-500 to-violet-500",
  "Mới nhất":     "from-cyan-400 to-blue-500",
  "Đang hot":     "from-orange-400 to-pink-500",
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="feed-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded skeleton-shimmer" />
          <div className="h-2.5 w-20 rounded skeleton-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded skeleton-shimmer" />
      </div>
      <div className="h-40 w-full rounded-xl skeleton-shimmer" />
      <div className="flex gap-4">
        <div className="h-7 w-16 rounded-lg skeleton-shimmer" />
        <div className="h-7 w-16 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  );
}

// ── Story bar ─────────────────────────────────────────────────────────────────
function StoryBar() {
  const { user } = useAuthStore();

  const { data: friends } = useQuery({
    queryKey: ["story-friends"],
    queryFn: async () => {
      const { data } = await apiClient.get("/social/friends?limit=12");
      return data.data?.friends || [];
    },
    staleTime: 60_000,
  });

  const stories = [
    { id: "self", username: user?.username ?? "Bạn", avatarUrl: null, isSelf: true, hasStory: false },
    ...(friends || []).slice(0, 10).map((f: any) => ({
      id: f.id,
      username: f.profile?.displayName || f.username,
      avatarUrl: f.profile?.avatarUrl,
      isSelf: false,
      hasStory: Math.random() > 0.4,
    })),
  ];

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {stories.map((s, i) => (
          <div
            key={s.id}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            style={{ animation: "slide-up-fade 0.4s ease-out both", animationDelay: `${i * 60}ms` }}
          >
            <div className="relative">
              {/* Story ring */}
              <div className={`w-14 h-14 rounded-full p-[2px] ${
                s.isSelf
                  ? "bg-gradient-to-br from-pink-500 to-violet-600"
                  : s.hasStory
                  ? "story-ring-animated"
                  : "bg-white/10"
              }`}>
                <div className="w-full h-full rounded-full bg-[#080811] p-0.5 overflow-hidden">
                  {s.avatarUrl ? (
                    <img src={s.avatarUrl} alt={s.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{s.username[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Online dot */}
              {!s.isSelf && s.hasStory && (
                <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#080811]" />
              )}
              {/* Self + button */}
              {s.isSelf && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-pink-500 to-violet-600 rounded-full flex items-center justify-center border-2 border-[#080811] shadow-lg shadow-pink-500/30">
                  <Plus size={10} className="text-white" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-white/50 truncate w-14 text-center">
              {s.isSelf ? "Của bạn" : s.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trending anime strip ──────────────────────────────────────────────────────
function TrendingStrip() {
  const { data: trending } = useQuery({
    queryKey: ["feed-trending-anime"],
    queryFn: async () => {
      const { data } = await apiClient.get("/anime/top?limit=8");
      return data.data?.items || [];
    },
    staleTime: 5 * 60_000,
  });

  if (!trending?.length) return null;

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Icon with glow */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <TrendingUp size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white/90">Anime đang hot</span>
        </div>
        <Link href="/anime" className="group flex items-center gap-0.5 text-xs text-pink-400 hover:text-pink-300 transition-colors">
          Xem tất cả
          <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {trending.slice(0, 8).map((a: any, i: number) => (
          <Link key={a.mal_id} href={`/anime/${a.mal_id}`} className="flex-shrink-0 w-16 group">
            <div className="relative w-16 rounded-xl overflow-hidden mb-1 ring-1 ring-white/5 group-hover:ring-pink-500/40 transition-all duration-500">
              <img
                src={a.images?.jpg?.image_url}
                alt={a.title}
                className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                style={{ height: "88px" }}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Score */}
              {a.score && (
                <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-yellow-400 text-[9px] font-bold px-1 rounded">
                  ★ {a.score}
                </div>
              )}
              {/* Rank badge */}
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-600/80 backdrop-blur-sm flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">{i + 1}</span>
              </div>
            </div>
            <p className="text-[10px] text-white/50 line-clamp-2 leading-tight">
              {a.title_english || a.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main feed ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("Dành cho bạn");
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ["feed", tab],
      queryFn: async ({ pageParam }) => {
        const endpoint = tab === "Đang hot" ? "/posts/explore" : "/posts/feed";
        const params: any = { limit: 10 };
        if (pageParam) params.cursor = pageParam;
        if (tab === "Mới nhất") params.sort = "new";
        const { data } = await apiClient.get(endpoint, { params });
        return data.data;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => setHasNewPosts(true);
    socket.on("feed:new-post", handler);
    return () => { socket.off("feed:new-post", handler); };
  }, []);

  const allPosts = data?.pages.flatMap((p) => p?.posts || []) || [];

  return (
    <div className="space-y-4 pb-8" style={{ background: "#080811", minHeight: "100vh" }}>
        <StoryBar />
        <CreatePostBox user={user} />
        <TrendingStrip />

        {/* Tab bar */}
        <div className="feed-card rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/[0.06]">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setHasNewPosts(false); }}
                className="relative flex-1 py-3 text-sm font-medium transition-colors"
                style={{
                  color: tab === t ? "white" : "rgba(255,255,255,0.4)",
                }}
              >
                {t === "Dành cho bạn" && <Sparkles size={12} className="inline mr-1 text-pink-400" />}
                {t === "Đang hot"     && <TrendingUp size={12} className="inline mr-1 text-orange-400" />}
                {/* Gradient text when active */}
                {tab === t ? (
                  <span
                    className={`bg-gradient-to-r ${TAB_ACCENT[t]} bg-clip-text text-transparent font-semibold`}
                  >
                    {t === "Dành cho bạn" && <Sparkles size={12} className="inline mr-1 text-pink-400" />}
                    {t === "Đang hot"     && <TrendingUp size={12} className="inline mr-1 text-orange-400" />}
                    {t}
                  </span>
                ) : t}
                {/* Active glow indicator */}
                {tab === t && (
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[40%] rounded-full bg-gradient-to-r ${TAB_ACCENT[t]}`}
                    style={{ boxShadow: "0 0 8px rgba(236,72,153,0.6)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* New posts toast */}
        {hasNewPosts && (
          <button
            onClick={() => { refetch(); setHasNewPosts(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="shimmer-btn w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-medium rounded-2xl shadow-lg shadow-pink-900/30"
          >
            <RefreshCw size={14} className="animate-spin" />
            Có bài đăng mới — Nhấn để tải
          </button>
        )}

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="feed-card rounded-2xl p-12 text-center">
            {/* Pulsing aura empty state */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/30 to-violet-500/30 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Tv size={32} className="text-white/40" />
              </div>
            </div>
            <p className="text-white/40 text-sm mb-4">Chưa có bài đăng nào. Hãy theo dõi thêm bạn bè!</p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-pink-900/30 hover:opacity-90 transition-opacity"
            >
              <Sparkles size={14} />
              Khám phá cộng đồng
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.map((post: any, i: number) => (
              <div
                key={post._id}
                className="feed-card rounded-2xl overflow-hidden"
                style={
                  i < 5
                    ? { animation: "slide-up-fade 0.4s ease-out both", animationDelay: `${Math.min(i * 60, 200)}ms` }
                    : undefined
                }
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={bottomRef} className="py-4 flex items-center justify-center gap-2">
          {isFetchingNextPage && (
            <>
              <Loader2 className="animate-spin text-pink-500" size={16} />
              <span className="text-xs text-white/30">Đang tải thêm...</span>
            </>
          )}
          {!hasNextPage && allPosts.length > 0 && (
            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-xs text-white/25 whitespace-nowrap">Đã xem hết bài đăng</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>
          )}
        </div>
    </div>
  );
}
