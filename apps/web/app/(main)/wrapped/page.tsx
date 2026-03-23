"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import apiClient from "../../../lib/api-client";
import { Loader2, Sparkles, Tv, BookOpen, Star, Zap, TrendingUp, Share2, Download, X } from "lucide-react";
import { toast } from "sonner";

// Share card overlay — renders a styled card and lets user download it
function ShareCard({ data, year, onClose }: { data: any; year: number; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import("html2canvas");
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `anime-wrapped-${year}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Đã tải ảnh về!");
    } catch {
      // Fallback: copy text
      const text = `🎌 Anime Wrapped ${year}\n✅ ${data.animeCompleted} anime hoàn thành\n📺 ${data.totalEpisodes} tập phim\n📚 ${data.mangaCompleted} manga\n⭐ Thể loại yêu thích: ${data.topGenre || "N/A"}\n\n#AnimeWrapped #AnimeSocial`;
      navigator.clipboard.writeText(text);
      toast.success("Đã sao chép nội dung chia sẻ!");
    }
  };

  const handleShare = async () => {
    const text = `🎌 Anime Wrapped ${year} của tôi!\n✅ ${data.animeCompleted} anime hoàn thành\n📺 ${data.totalEpisodes} tập phim\n⭐ Thể loại yêu thích: ${data.topGenre || "N/A"}\n\n#AnimeWrapped #AnimeSocial`;
    if (navigator.share) {
      await navigator.share({ title: `Anime Wrapped ${year}`, text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Đã sao chép để chia sẻ!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="space-y-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* The shareable card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white text-center shadow-2xl"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <div className="text-4xl mb-2">🎌</div>
          <p className="text-pink-200 text-sm font-medium mb-1">Anime Wrapped</p>
          <p className="text-2xl font-black mb-6">{year}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { emoji: "✅", value: data.animeCompleted, label: "Anime" },
              { emoji: "📺", value: data.totalEpisodes, label: "Tập phim" },
              { emoji: "📚", value: data.mangaCompleted, label: "Manga" },
              { emoji: "📖", value: data.totalChapters, label: "Chapter" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3">
                <p className="text-xl">{s.emoji}</p>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-pink-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {data.topGenre && (
            <div className="bg-white/10 rounded-2xl p-3 mb-4">
              <p className="text-pink-200 text-xs mb-1">Thể loại yêu thích</p>
              <p className="text-xl font-black">{data.topGenre}</p>
            </div>
          )}

          {data.topAnime?.slice(0, 3).length > 0 && (
            <div className="flex justify-center gap-2 mb-4">
              {data.topAnime.slice(0, 3).map((a: any, i: number) => (
                a.image && <img key={i} src={a.image} alt={a.title} className="w-14 h-20 object-cover rounded-xl border-2 border-white/30" />
              ))}
            </div>
          )}

          <p className="text-pink-200 text-xs">animesocial.vn · #AnimeWrapped</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
            <X size={15} /> Đóng
          </button>
          <button onClick={handleDownload} className="flex-1 py-3 rounded-2xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
            <Download size={15} /> Tải ảnh
          </button>
          <button onClick={handleShare} className="flex-1 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Share2 size={15} /> Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  const colors: Record<string, string> = {
    yellow: "bg-yellow-50 dark:bg-yellow-950/20",
    purple: "bg-purple-50 dark:bg-purple-950/20",
    pink: "bg-pink-50 dark:bg-pink-950/20",
    blue: "bg-blue-50 dark:bg-blue-950/20",
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-5 text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function WrappedPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 1);
  const [showShareCard, setShowShareCard] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["wrapped", year],
    queryFn: async () => {
      const { data } = await apiClient.get(`/users/me/wrapped?year=${year}`);
      return data.data;
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-pink-500" size={28} />
          Anime Wrapped
        </h1>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={() => setShowShareCard(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Share2 size={14} /> Chia sẻ
            </button>
          )}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            {[currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" size={32} /></div>
      ) : data ? (
        <div className="space-y-4">
          {/* Hero card */}
          <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white text-center shadow-2xl">
            <p className="text-pink-200 text-sm font-medium mb-2">Năm {year} của bạn</p>
            <h2 className="text-5xl font-black mb-1">{data.animeCompleted}</h2>
            <p className="text-pink-100 text-lg">anime đã hoàn thành</p>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div>
                <p className="font-bold text-xl">{data.totalEpisodes}</p>
                <p className="text-pink-200">tập phim</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="font-bold text-xl">{data.mangaCompleted}</p>
                <p className="text-pink-200">manga đọc xong</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="font-bold text-xl">{data.totalChapters}</p>
                <p className="text-pink-200">chapter</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Zap className="text-yellow-500" size={24} />} value={data.totalExp} label="EXP kiếm được" color="yellow" />
            <StatCard icon={<Star className="text-purple-500" size={24} />} value={data.reviewsWritten} label="Review đã viết" color="purple" />
            <StatCard icon={<Tv className="text-pink-500" size={24} />} value={data.animeCompleted} label="Anime hoàn thành" color="pink" />
            <StatCard icon={<BookOpen className="text-blue-500" size={24} />} value={data.mangaCompleted} label="Manga hoàn thành" color="blue" />
          </div>

          {/* Top genre */}
          {data.topGenre && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
              <TrendingUp className="mx-auto text-pink-500 mb-2" size={28} />
              <p className="text-slate-500 text-sm mb-1">Thể loại yêu thích</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{data.topGenre}</p>
            </div>
          )}

          {/* Genre breakdown */}
          {data.genreBreakdown && Object.keys(data.genreBreakdown).length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Phân tích thể loại</h3>
              <div className="space-y-2">
                {Object.entries(data.genreBreakdown as Record<string, number>)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([genre, count]) => {
                    const max = Math.max(...Object.values(data.genreBreakdown as Record<string, number>));
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={genre} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-24 shrink-0">{genre}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Top anime */}
          {data.topAnime?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Anime đã xem</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {data.topAnime.map((a: any, i: number) => (
                  <div key={i} className="shrink-0 w-20 text-center">
                    {a.image ? (
                      <img src={a.image} alt={a.title} className="w-20 h-28 object-cover rounded-xl mb-1" />
                    ) : (
                      <div className="w-20 h-28 bg-slate-200 dark:bg-slate-700 rounded-xl mb-1" />
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{a.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share CTA */}
          <button
            onClick={() => setShowShareCard(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Share2 size={18} /> Chia sẻ Wrapped của bạn
          </button>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">Không có dữ liệu cho năm {year}</div>
      )}

      {showShareCard && data && (
        <ShareCard data={data} year={year} onClose={() => setShowShareCard(false)} />
      )}
    </div>
  );
}
