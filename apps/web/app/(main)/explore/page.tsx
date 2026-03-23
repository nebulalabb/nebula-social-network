"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Loader2, DoorOpen, Users, Star, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "../../../lib/api-client";
import { PostCard } from "../../../components/feed/post-card";
import { AnimeCard } from "../../../components/profile/anime-card";
import { useDebounce } from "@/hooks/use-debounce";

const TABS = ["Tất cả", "Bài đăng", "Anime", "Manga", "Người dùng", "Phòng"] as const;
type Tab = (typeof TABS)[number];

const TRENDING_TAGS = ["OnePiece", "DemonSlayer", "JujutsuKaisen", "AttackOnTitan", "Naruto", "Bleach", "HunterXHunter", "Vinland"];

// ── Public rooms discovery ────────────────────────────────────────────────────
function RoomsSection({ search }: { search: string }) {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["explore-rooms", search],
    queryFn: async () => {
      const params: any = { limit: 12, isPublic: true };
      if (search) params.q = search;
      const { data } = await apiClient.get("/rooms", { params });
      return data.data?.rooms || [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-pink-600" size={20} /></div>;

  if (!rooms?.length) return (
    <div className="text-center py-8">
      <DoorOpen size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
      <p className="text-sm text-slate-500">Chưa có phòng công khai nào</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {rooms.map((room: any) => (
        <Link
          key={room.id}
          href={`/room/${room.id}`}
          className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-slate-900 transition-all hover:shadow-md"
        >
          {/* Room avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <DoorOpen size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-pink-600 transition-colors">
              {room.name}
            </p>
            {room.description && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{room.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Users size={10} /> {room._count?.decors ?? 0} vật phẩm
              </span>
              {room.theme && room.theme !== "default" && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-full">
                  {room.theme}
                </span>
              )}
            </div>
          </div>
          <div className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
            Vào →
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserCard({ user }: { user: any }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-slate-900 transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
        {user.profile?.avatarUrl ? (
          <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-sm font-bold">{(user.profile?.displayName || user.username)[0].toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-pink-600 transition-colors truncate">
          {user.profile?.displayName || user.username}
        </p>
        <p className="text-xs text-slate-500">@{user.username}</p>
      </div>
      {user.profile?.totalWatchHours > 0 && (
        <div className="flex items-center gap-1 text-xs text-yellow-500">
          <Star size={11} fill="currentColor" />
          <span>{Math.round(user.profile.totalWatchHours)}h</span>
        </div>
      )}
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") || "";
  const [search, setSearch] = useState(initialTag ? `#${initialTag}` : "");
  const [tab, setTab] = useState<Tab>("Tất cả");
  const debouncedSearch = useDebounce(search, 400);

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["explore-posts", debouncedSearch],
    queryFn: async () => {
      const params: any = { limit: 20 };
      if (debouncedSearch.startsWith("#")) params.hashtag = debouncedSearch.slice(1);
      else if (debouncedSearch) params.q = debouncedSearch;
      const { data } = await apiClient.get("/posts/explore", { params });
      return data.data?.posts || [];
    },
    enabled: tab === "Tất cả" || tab === "Bài đăng",
  });

  const { data: animeResults, isLoading: loadingAnime } = useQuery({
    queryKey: ["explore-anime", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        const { data } = await apiClient.get("/anime/top");
        return data.data?.items || [];
      }
      const { data } = await apiClient.get(`/anime/search?q=${debouncedSearch.replace(/^#/, "")}`);
      return data.data?.items || [];
    },
    enabled: tab === "Tất cả" || tab === "Anime",
  });

  const { data: mangaResults, isLoading: loadingManga } = useQuery({
    queryKey: ["explore-manga", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        const { data } = await apiClient.get("/manga/top");
        return data.data?.items || [];
      }
      const { data } = await apiClient.get(`/manga/search?q=${debouncedSearch.replace(/^#/, "")}`);
      return data.data?.items || [];
    },
    enabled: tab === "Tất cả" || tab === "Manga",
  });

  const { data: userResults } = useQuery({
    queryKey: ["explore-users", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const { data } = await apiClient.get(`/users/search?q=${debouncedSearch}`);
      return data.data || [];
    },
    enabled: (tab === "Tất cả" || tab === "Người dùng") && !!debouncedSearch,
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm anime, manga, người dùng, phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Trending tags */}
        {!search && (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-pink-600" />
              <span className="text-xs font-medium text-slate-500">Trending</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(`#${tag}`)}
                  className="text-xs px-3 py-1 bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 rounded-full hover:bg-pink-100 dark:hover:bg-pink-950/40 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 min-w-fit py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t
                  ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50/50 dark:bg-pink-950/10"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t === "Phòng" && <DoorOpen size={12} className="inline mr-1" />}
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-6">
          {/* Posts */}
          {(tab === "Tất cả" || tab === "Bài đăng") && (
            <section>
              {tab === "Tất cả" && (
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-pink-500" /> Bài đăng
                  </h2>
                  {tab === "Tất cả" && posts?.length > 3 && (
                    <button onClick={() => setTab("Bài đăng")} className="text-xs text-pink-500 hover:text-pink-600">Xem thêm</button>
                  )}
                </div>
              )}
              {loadingPosts ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-pink-600" size={20} /></div>
              ) : posts?.length > 0 ? (
                <div className="space-y-4">
                  {posts.slice(0, tab === "Tất cả" ? 3 : 20).map((p: any) => <PostCard key={p._id} post={p} />)}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Không có bài đăng nào</p>
              )}
            </section>
          )}

          {/* Anime */}
          {(tab === "Tất cả" || tab === "Anime") && (
            <section>
              {tab === "Tất cả" && (
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-300">Anime</h2>
                  <Link href="/anime" className="text-xs text-pink-500 hover:text-pink-600">Xem thêm</Link>
                </div>
              )}
              {loadingAnime ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-pink-600" size={20} /></div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(animeResults || []).slice(0, tab === "Tất cả" ? 5 : 20).map((a: any) => (
                    <AnimeCard key={a.mal_id} id={a.mal_id} title={a.title_english || a.title} imageUrl={a.images?.jpg?.image_url} score={a.score} size="sm" />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Manga */}
          {(tab === "Tất cả" || tab === "Manga") && (
            <section>
              {tab === "Tất cả" && (
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-300">Manga</h2>
                  <Link href="/manga" className="text-xs text-pink-500 hover:text-pink-600">Xem thêm</Link>
                </div>
              )}
              {loadingManga ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-pink-600" size={20} /></div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(mangaResults || []).slice(0, tab === "Tất cả" ? 5 : 20).map((m: any) => (
                    <AnimeCard key={m.mal_id} id={m.mal_id} title={m.title_english || m.title} imageUrl={m.images?.jpg?.image_url} score={m.score} size="sm" />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Users */}
          {(tab === "Tất cả" || tab === "Người dùng") && debouncedSearch && (
            <section>
              {tab === "Tất cả" && <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Người dùng</h2>}
              {userResults?.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Không tìm thấy người dùng</p>
              ) : (
                <div className="space-y-2">
                  {userResults?.slice(0, tab === "Tất cả" ? 3 : 20).map((u: any) => (
                    <UserCard key={u.id} user={u} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Rooms */}
          {(tab === "Tất cả" || tab === "Phòng") && (
            <section>
              {tab === "Tất cả" && (
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <DoorOpen size={14} className="text-purple-500" /> Phòng công khai
                  </h2>
                  <button onClick={() => setTab("Phòng")} className="text-xs text-pink-500 hover:text-pink-600">Xem thêm</button>
                </div>
              )}
              <RoomsSection search={debouncedSearch} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
