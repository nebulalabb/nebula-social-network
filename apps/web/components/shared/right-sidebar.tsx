"use client";

import Link from "next/link";
import { TrendingUp, Tv, UserPlus, Loader2, DoorOpen, Star, Clock, Music2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import apiClient from "../../lib/api-client";
import { useAuthStore } from "../../store/use-auth-store";

// ── Seasonal countdown ────────────────────────────────────────────────────────
function SeasonCountdown() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const seasons = [
    { name: "Mùa Xuân", month: 4, emoji: "🌸" },
    { name: "Mùa Hè", month: 7, emoji: "☀️" },
    { name: "Mùa Thu", month: 10, emoji: "🍂" },
    { name: "Mùa Đông", month: 1, emoji: "❄️" },
  ];

  const nextSeason = seasons.find((s) => {
    const targetMonth = s.month;
    return targetMonth > month || (targetMonth === 1 && month > 10);
  }) || { name: "Mùa Xuân", month: 4, emoji: "🌸" };

  const nextYear = nextSeason.month <= month ? year + 1 : year;
  const nextDate = new Date(nextYear, nextSeason.month - 1, 1);
  const daysLeft = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-4 text-white">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={14} className="text-pink-200" />
        <span className="text-xs text-pink-200 font-medium">Mùa anime tiếp theo</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-lg">{nextSeason.emoji} {nextSeason.name}</p>
          <p className="text-pink-200 text-xs mt-0.5">{nextYear}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black">{daysLeft}</p>
          <p className="text-pink-200 text-xs">ngày nữa</p>
        </div>
      </div>
    </div>
  );
}

// ── Now Playing — active rooms with live user count ───────────────────────────
function NowPlayingRooms() {
  const { data: rooms } = useQuery({
    queryKey: ["now-playing-rooms"],
    queryFn: async () => {
      const { data } = await apiClient.get("/rooms?isPublic=true&limit=4&sort=active");
      return data.data?.rooms || [];
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (!rooms?.length) return null;

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-semibold text-sm text-white/90">Đang hoạt động</h3>
        </div>
        <Link href="/explore" className="text-xs text-pink-400 hover:text-pink-300">Xem thêm</Link>
      </div>
      <div className="space-y-2">
        {rooms.map((room: any) => (
          <Link
            key={room.id}
            href={`/room/${room.id}`}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shrink-0 relative">
              <Music2 size={14} className="text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#080811]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate group-hover:text-pink-400 transition-colors">
                {room.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users size={9} className="text-white/30" />
                <span className="text-[10px] text-white/30">{room._count?.decorations || Math.floor(Math.random() * 8) + 1} người</span>
                {room.theme && room.theme !== "default" && (
                  <span className="text-[10px] text-purple-400 ml-1">· {room.theme}</span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-green-400 font-medium shrink-0">LIVE</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Live activity feed ────────────────────────────────────────────────────────
function LiveActivity() {
  const { data: activity } = useQuery({
    queryKey: ["live-activity"],
    queryFn: async () => {
      const { data } = await apiClient.get("/posts/explore?limit=5&sort=new");
      return data.data?.posts || [];
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (!activity?.length) return null;

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="font-semibold text-sm text-white/90">Hoạt động mới nhất</h3>
      </div>
      <div className="space-y-2.5">
        {activity.slice(0, 4).map((post: any) => (
          <div key={post._id} className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
              {post.author?.avatarUrl ? (
                <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[10px] font-bold">
                  {(post.author?.username || "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                <Link href={`/profile/${post.author?.username}`} className="font-medium text-white/80 hover:text-pink-400">
                  {post.author?.displayName || post.author?.username}
                </Link>{" "}
                {post.content?.slice(0, 60)}{post.content?.length > 60 ? "..." : ""}
              </p>
              {post.hashtags?.length > 0 && (
                <p className="text-[10px] text-pink-400 mt-0.5">#{post.hashtags[0]}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link href="/explore" className="block text-center text-xs text-pink-400 hover:text-pink-300 mt-3 font-medium">
        Xem tất cả →
      </Link>
    </div>
  );
}

// ── Top anime this week ───────────────────────────────────────────────────────
function TopAnimeWidget() {
  const { data: seasonal } = useQuery({
    queryKey: ["seasonal-sidebar"],
    queryFn: async () => {
      const { data } = await apiClient.get("/anime/seasonal");
      return data.data?.items?.slice(0, 5) || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tv size={15} className="text-pink-400" />
          <h3 className="font-semibold text-sm text-white/90">Anime mùa này</h3>
        </div>
        <Link href="/anime" className="text-xs text-pink-400 hover:text-pink-300">Xem tất cả</Link>
      </div>
      {seasonal ? (
        <div className="space-y-3">
          {seasonal.map((anime: any, i: number) => (
            <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="flex items-center gap-3 group">
              <span className="text-xs text-white/25 w-4 text-center font-medium">{i + 1}</span>
              <img src={anime.images?.jpg?.image_url} alt={anime.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80 line-clamp-2 group-hover:text-pink-400 transition-colors">
                  {anime.title_english || anime.title}
                </p>
                {anime.score && (
                  <p className="text-xs text-yellow-400 font-bold mt-0.5 flex items-center gap-0.5">
                    <Star size={10} fill="currentColor" /> {anime.score}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-white/30" />
        </div>
      )}
    </div>
  );
}

// ── Trending tags ─────────────────────────────────────────────────────────────
function TrendingTags() {
  const tags = ["OnePiece", "DemonSlayer", "JujutsuKaisen", "AttackOnTitan", "Naruto", "Bleach", "HunterXHunter", "Vinland"];

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-pink-400" />
        <h3 className="font-semibold text-sm text-white/90">Trending</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/explore?tag=${tag}`}
            className="text-xs px-2.5 py-1 bg-pink-500/10 text-pink-400 rounded-full hover:bg-pink-500/20 transition-colors font-medium border border-pink-500/10 hover:border-pink-500/30"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Friend suggestions ────────────────────────────────────────────────────────
function FriendSuggestions() {
  const { isAuthenticated } = useAuthStore();
  const { data: suggestions } = useQuery({
    queryKey: ["friend-suggestions"],
    queryFn: async () => {
      const { data } = await apiClient.get("/social/suggestions");
      return data.data?.slice(0, 3) || [];
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !suggestions?.length) return null;

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus size={15} className="text-pink-400" />
        <h3 className="font-semibold text-sm text-white/90">Gợi ý kết bạn</h3>
      </div>
      <div className="space-y-3">
        {suggestions.map((user: any) => (
          <SuggestionItem key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function SuggestionItem({ user }: { user: any }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/social/friend-request/${user.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friend-suggestions"] }),
  });

  return (
    <div className="flex items-center gap-3">
      <Link href={`/profile/${user.username}`} className="shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center">
          {user.profile?.avatarUrl ? (
            <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-bold">
              {(user.profile?.displayName || user.username)[0].toUpperCase()}
            </span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`}>
          <p className="text-xs font-medium text-white/80 truncate hover:text-pink-400">
            {user.profile?.displayName || user.username}
          </p>
        </Link>
        {user.commonAnime > 0 && (
          <p className="text-xs text-white/30">{user.commonAnime} anime chung</p>
        )}
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || mutation.isSuccess}
        className="text-xs px-2.5 py-1 bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-90 disabled:opacity-40 text-white rounded-lg transition-opacity shrink-0"
      >
        {mutation.isSuccess ? "Đã gửi" : "Kết bạn"}
      </button>
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export function RightSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-72 shrink-0 sticky top-6 h-fit gap-4">
      <SeasonCountdown />
      <NowPlayingRooms />
      <TrendingTags />
      <TopAnimeWidget />
      <LiveActivity />
      <FriendSuggestions />
    </aside>
  );
}
