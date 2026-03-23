"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink, Loader2, Clock, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import apiClient from "../../../lib/api-client";
import { cn } from "../../../lib/utils";

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "anime", label: "Anime" },
  { key: "manga", label: "Manga" },
  { key: "game", label: "Game" },
  { key: "merchandise", label: "Merchandise" },
];

// Dùng Jikan news API
export default function NewsPage() {
  const [category, setCategory] = useState("all");

  const { data: animeNews, isLoading: loadingAnime } = useQuery({
    queryKey: ["news-anime"],
    queryFn: async () => {
      const { data } = await apiClient.get("/news/anime");
      return data.data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: mangaNews, isLoading: loadingManga } = useQuery({
    queryKey: ["news-manga"],
    queryFn: async () => {
      const { data } = await apiClient.get("/news/manga");
      return data.data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const isLoading = loadingAnime || loadingManga;

  const allNews = [
    ...(animeNews || []).map((n: any) => ({ ...n, category: "anime" })),
    ...(mangaNews || []).map((n: any) => ({ ...n, category: "manga" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = category === "all" ? allNews : allNews.filter((n) => n.category === category);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Newspaper size={24} />
          <div>
            <h1 className="text-xl font-bold">Tin tức Anime & Manga</h1>
            <p className="text-orange-100 text-sm">Cập nhật mới nhất từ cộng đồng</p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                category === cat.key
                  ? "bg-pink-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-pink-600" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Newspaper size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có tin tức</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Featured */}
          {filtered[0] && (
            <a
              href={filtered[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-pink-300 dark:hover:border-pink-800 transition-colors group"
            >
              {filtered[0].images?.jpg?.image_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={filtered[0].images.jpg.image_url}
                    alt={filtered[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    filtered[0].category === "anime"
                      ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      : "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
                  )}>
                    {filtered[0].category === "anime" ? "Anime" : "Manga"}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {filtered[0].date ? formatDistanceToNow(new Date(filtered[0].date), { addSuffix: true, locale: vi }) : ""}
                  </span>
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white group-hover:text-pink-600 transition-colors line-clamp-2">
                  {filtered[0].title}
                </h2>
                {filtered[0].excerpt && (
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{filtered[0].excerpt}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-pink-600">
                  <ExternalLink size={12} /> Đọc thêm
                </div>
              </div>
            </a>
          )}

          {/* Rest */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(1).map((news: any, i: number) => (
              <a
                key={i}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {news.images?.jpg?.image_url && (
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={news.images.jpg.image_url}
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      news.category === "anime"
                        ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600"
                        : "bg-purple-100 dark:bg-purple-950/30 text-purple-600"
                    )}>
                      {news.category === "anime" ? "Anime" : "Manga"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {news.date ? formatDistanceToNow(new Date(news.date), { addSuffix: true, locale: vi }) : ""}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {news.title}
                  </p>
                </div>
                <ExternalLink size={14} className="text-slate-400 shrink-0 mt-1" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
