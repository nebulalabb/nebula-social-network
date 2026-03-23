"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Tv, BookOpen, Users, Hash, Loader2, Star } from "lucide-react";
import apiClient from "../../../lib/api-client";
import Link from "next/link";
import { cn } from "../../../lib/utils";

const TABS = [
  { key: "all", label: "Tất cả", icon: Search },
  { key: "anime", label: "Anime", icon: Tv },
  { key: "manga", label: "Manga", icon: BookOpen },
  { key: "users", label: "Người dùng", icon: Users },
  { key: "posts", label: "Bài đăng", icon: Hash },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tab, setTab] = useState<TabKey>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, tab],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return null;
      const { data } = await apiClient.get("/search", {
        params: { q: debouncedQuery, type: tab === "all" ? undefined : tab, limit: 10 },
      });
      return data.data;
    },
    enabled: !!debouncedQuery.trim(),
  });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm anime, manga, người dùng, bài đăng..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
          />
          {isLoading && (
            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-500 animate-spin" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                tab === key
                  ? "bg-pink-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!debouncedQuery.trim() ? (
        <EmptyState />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-pink-600" size={24} />
        </div>
      ) : !data ? (
        <NoResults query={debouncedQuery} />
      ) : (
        <SearchResults data={data} tab={tab} query={debouncedQuery} />
      )}
    </div>
  );
}

function EmptyState() {
  const suggestions = ["Naruto", "One Piece", "Demon Slayer", "Attack on Titan", "Jujutsu Kaisen"];
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
      <Search size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-500 mb-4">Tìm kiếm anime, manga, người dùng...</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((s) => (
          <Link
            key={s}
            href={`/search?q=${encodeURIComponent(s)}`}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
      <p className="text-slate-500">Không tìm thấy kết quả cho "<span className="text-pink-600 font-medium">{query}</span>"</p>
    </div>
  );
}

function SearchResults({ data, tab, query }: { data: any; tab: TabKey; query: string }) {
  const hasAnime = data?.anime?.length > 0;
  const hasManga = data?.manga?.length > 0;
  const hasUsers = data?.users?.length > 0;
  const hasPosts = data?.posts?.length > 0;

  if (!hasAnime && !hasManga && !hasUsers && !hasPosts) return <NoResults query={query} />;

  return (
    <div className="space-y-4">
      {(tab === "all" || tab === "anime") && hasAnime && (
        <Section title="Anime" icon={Tv} viewAllHref={`/search?q=${query}&tab=anime`}>
          {data.anime.map((a: any) => <AnimeResult key={a.malId || a.id} item={a} />)}
        </Section>
      )}
      {(tab === "all" || tab === "manga") && hasManga && (
        <Section title="Manga" icon={BookOpen} viewAllHref={`/search?q=${query}&tab=manga`}>
          {data.manga.map((m: any) => <MangaResult key={m.malId || m.id} item={m} />)}
        </Section>
      )}
      {(tab === "all" || tab === "users") && hasUsers && (
        <Section title="Người dùng" icon={Users} viewAllHref={`/search?q=${query}&tab=users`}>
          {data.users.map((u: any) => <UserResult key={u.id} user={u} />)}
        </Section>
      )}
      {(tab === "all" || tab === "posts") && hasPosts && (
        <Section title="Bài đăng" icon={Hash} viewAllHref={`/search?q=${query}&tab=posts`}>
          {data.posts.map((p: any) => <PostResult key={p._id} post={p} />)}
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, viewAllHref, children }: { title: string; icon: any; viewAllHref: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Icon size={16} className="text-pink-500" /> {title}
        </div>
        <Link href={viewAllHref} className="text-xs text-pink-600 hover:underline">Xem tất cả</Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </div>
  );
}

function AnimeResult({ item }: { item: any }) {
  return (
    <Link href={`/anime/${item.malId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        {item.images?.jpg?.image_url || item.images?.webp?.image_url ? (
          <img src={item.images?.jpg?.image_url || item.images?.webp?.image_url} alt="" className="w-full h-full object-cover" />
        ) : <Tv size={16} className="m-auto mt-4 text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.titleEn || item.title}</p>
        <p className="text-xs text-slate-500 truncate">{item.titleJp}</p>
        <div className="flex items-center gap-2 mt-1">
          {item.score && <span className="flex items-center gap-0.5 text-xs text-yellow-500"><Star size={10} fill="currentColor" />{item.score}</span>}
          <span className="text-xs text-slate-400">{item.type} · {item.episodes ? `${item.episodes} tập` : "?"}</span>
        </div>
      </div>
    </Link>
  );
}

function MangaResult({ item }: { item: any }) {
  return (
    <Link href={`/manga/${item.malId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        {item.images?.jpg?.image_url ? (
          <img src={item.images.jpg.image_url} alt="" className="w-full h-full object-cover" />
        ) : <BookOpen size={16} className="m-auto mt-4 text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.titleEn || item.title}</p>
        <p className="text-xs text-slate-500 truncate">{item.titleJp}</p>
        <div className="flex items-center gap-2 mt-1">
          {item.score && <span className="flex items-center gap-0.5 text-xs text-yellow-500"><Star size={10} fill="currentColor" />{item.score}</span>}
          <span className="text-xs text-slate-400">{item.chapters ? `${item.chapters} chương` : "Đang tiến hành"}</span>
        </div>
      </div>
    </Link>
  );
}

function UserResult({ user }: { user: any }) {
  return (
    <Link href={`/profile/${user.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden shrink-0 flex items-center justify-center">
        {user.profile?.avatarUrl ? (
          <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : <span className="text-white text-sm font-bold">{user.username[0].toUpperCase()}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.profile?.displayName || user.username}</p>
        <p className="text-xs text-slate-500">@{user.username}</p>
      </div>
    </Link>
  );
}

function PostResult({ post }: { post: any }) {
  return (
    <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden shrink-0 flex items-center justify-center">
          {post.author?.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : <span className="text-white text-[10px] font-bold">{(post.author?.username || "?")[0].toUpperCase()}</span>}
        </div>
        <span className="text-xs text-slate-500">@{post.author?.username}</span>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{post.content}</p>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
