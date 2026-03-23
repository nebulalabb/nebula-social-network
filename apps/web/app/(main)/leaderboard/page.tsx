"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Tv, BookOpen, Loader2, Crown } from "lucide-react";
import Link from "next/link";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";

const TABS = [
  { value: "exp", label: "EXP", icon: Trophy },
  { value: "anime", label: "Anime", icon: Tv },
  { value: "manga", label: "Manga", icon: BookOpen },
] as const;

const RANK_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-600"];
const RANK_BG = ["bg-yellow-50 dark:bg-yellow-950/20", "bg-slate-50 dark:bg-slate-800/50", "bg-amber-50 dark:bg-amber-950/20"];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"exp" | "anime" | "manga">("exp");
  const { user } = useAuthStore();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async () => {
      const { data } = await apiClient.get(`/gamification/leaderboard?type=${tab}`);
      return data.data;
    },
  });

  const { data: myStats } = useQuery({
    queryKey: ["my-gamification-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/gamification/me");
      return data.data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      {/* My stats */}
      {myStats && (
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Cấp độ của bạn</p>
              <h2 className="text-2xl font-bold mt-0.5">{myStats.level?.title}</h2>
              <p className="text-pink-200 text-sm mt-1">Level {myStats.level?.level} · {myStats.totalExp} EXP</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trophy size={32} className="text-yellow-300" />
            </div>
          </div>
          {myStats.level?.nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-pink-200 mb-1">
                <span>Tiến độ lên {myStats.level.nextLevel.title}</span>
                <span>{myStats.level.progress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${myStats.level.progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Anime xem", value: myStats.animeCompleted },
              { label: "Manga đọc", value: myStats.mangaCompleted },
              { label: "Review", value: myStats.reviewsCount },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="font-bold text-lg">{value}</p>
                <p className="text-xs text-pink-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === value ? "text-pink-600 border-b-2 border-pink-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
          ) : !leaderboard?.length ? (
            <p className="text-center text-slate-500 text-sm py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => (
                <div
                  key={entry.user?.id || i}
                  className={`flex items-center gap-3 p-3 rounded-xl ${i < 3 ? RANK_BG[i] : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} transition-colors`}
                >
                  <div className={`w-8 text-center font-bold text-lg ${i < 3 ? RANK_COLORS[i] : "text-slate-400"}`}>
                    {i === 0 ? <Crown size={20} className="mx-auto text-yellow-500" /> : `#${entry.rank}`}
                  </div>
                  <Link href={`/profile/${entry.user?.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
                      {entry.user?.profile?.avatarUrl ? (
                        <img src={entry.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {(entry.user?.profile?.displayName || entry.user?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                        {entry.user?.profile?.displayName || entry.user?.username}
                      </p>
                      {tab === "exp" && entry.level && (
                        <p className="text-xs text-slate-500">{entry.level.title}</p>
                      )}
                    </div>
                  </Link>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {tab === "exp" ? `${entry.totalExp} EXP` : `${entry.count} ${tab === "anime" ? "anime" : "manga"}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
