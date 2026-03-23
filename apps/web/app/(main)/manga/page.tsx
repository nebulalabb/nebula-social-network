"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { AnimeCard } from "../../../components/profile/anime-card";
import { useDebounce } from "@/hooks/use-debounce";

const TABS = ["Tất cả", "Top", "Đang ra"] as const;
type Tab = (typeof TABS)[number];

export default function MangaPage() {
  const [tab, setTab] = useState<Tab>("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["manga", tab, debouncedSearch, page],
    queryFn: async () => {
      if (debouncedSearch) {
        const { data } = await apiClient.get(`/manga/search?q=${debouncedSearch}&page=${page}`);
        return data.data;
      }
      if (tab === "Top") {
        const { data } = await apiClient.get(`/manga/top?page=${page}`);
        return data.data;
      }
      const status = tab === "Đang ra" ? "publishing" : undefined;
      const { data } = await apiClient.get("/manga", { params: { status, page } });
      return data.data;
    },
  });

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Manga</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm manga..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {!debouncedSearch && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "text-pink-600 border-b-2 border-pink-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={28} /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">Không tìm thấy kết quả</p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {items.map((m: any) => (
                <AnimeCard key={m.mal_id} id={m.mal_id} title={m.title_english || m.title} imageUrl={m.images?.jpg?.image_url} score={m.score} />
              ))}
            </div>
            {data?.pagination && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Trang {page}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={!data.pagination.has_next_page}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
