"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/use-auth-store";
import { Loader2, Tv, BookOpen, Star, Clock, Trophy, TrendingUp } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const GENRE_COLORS = ["#ec4899", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];

export default function StatsPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["my-gamification-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/gamification/me");
      return data.data;
    },
    enabled: !!user,
  });

  const { data: animeList } = useQuery({
    queryKey: ["my-anime-list-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/anime/me/list");
      return data.data;
    },
    enabled: !!user,
  });

  const { data: mangaList } = useQuery({
    queryKey: ["my-manga-list-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/manga/me/list");
      return data.data;
    },
    enabled: !!user,
  });

  // Tính genre distribution từ anime list
  const genreData = (() => {
    if (!animeList) return [];
    const genreCount: Record<string, number> = {};
    animeList.forEach((item: any) => {
      (item.anime?.genres || []).forEach((g: string) => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });
    return Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }));
  })();

  // Radar data cho thể loại
  const radarData = genreData.slice(0, 6).map((d) => ({ subject: d.genre, A: d.count }));

  // Status distribution
  const animeStatusData = (() => {
    if (!animeList) return [];
    const counts: Record<string, number> = {};
    animeList.forEach((item: any) => { counts[item.status] = (counts[item.status] || 0) + 1; });
    const labels: Record<string, string> = {
      WATCHING: "Đang xem", COMPLETED: "Hoàn thành", ON_HOLD: "Tạm dừng",
      DROPPED: "Bỏ dở", PLAN_TO_WATCH: "Dự định xem",
    };
    return Object.entries(counts).map(([status, count]) => ({ name: labels[status] || status, count }));
  })();

  if (!user) return <div className="text-center py-20 text-slate-500">Vui lòng đăng nhập</div>;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" size={28} /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Thống kê của bạn</h1>
        <p className="text-pink-200 text-sm mt-1">Tổng quan hoạt động anime & manga</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Tv, label: "Anime đã xem", value: stats?.animeCompleted || 0, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { icon: BookOpen, label: "Manga đã đọc", value: stats?.mangaCompleted || 0, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
          { icon: Trophy, label: "Tổng EXP", value: stats?.totalExp || 0, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
          { icon: Star, label: "Review", value: stats?.reviewsCount || 0, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <Icon size={20} className={color} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Level progress */}
      {stats?.level && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{stats.level.title}</h2>
              <p className="text-sm text-slate-500">Level {stats.level.level}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-pink-600">{stats.totalExp} EXP</p>
              {stats.level.nextLevel && (
                <p className="text-xs text-slate-500">Cần {stats.level.nextLevel.minExp - stats.totalExp} EXP nữa</p>
              )}
            </div>
          </div>
          {stats.level.nextLevel && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{stats.level.title}</span>
                <span>{stats.level.nextLevel.title}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${stats.level.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">{stats.level.progress}%</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Genre radar */}
        {radarData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Thể loại yêu thích</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Radar name="Anime" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Anime status */}
        {animeStatusData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Trạng thái Anime List</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={animeStatusData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={90} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", color: "#f1f5f9" }}
                  cursor={{ fill: "rgba(236,72,153,0.1)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {animeStatusData.map((_, i) => (
                    <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top genres bar */}
      {genreData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Top thể loại</h2>
          <div className="space-y-3">
            {genreData.slice(0, 6).map((d, i) => (
              <div key={d.genre} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 w-28 truncate">{d.genre}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.count / genreData[0].count) * 100}%`,
                      background: GENRE_COLORS[i % GENRE_COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!animeList || animeList.length === 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <TrendingUp size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Thêm anime vào danh sách để xem thống kê</p>
        </div>
      )}
    </div>
  );
}
