"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import apiClient from "../../../lib/api-client";
import { Loader2, Users, Tv, BookOpen, Star, UserPlus, Shield } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace("/feed");
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/admin/stats");
      return data.data;
    },
    enabled: user?.role === "ADMIN",
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["admin-leaderboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/gamification/leaderboard?type=exp&limit=10");
      return data.data;
    },
    enabled: user?.role === "ADMIN",
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Shield size={48} className="mb-4 text-slate-300" />
        <p>Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-pink-500" size={28} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" size={32} /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AdminStatCard icon={<Users className="text-blue-500" size={24} />} value={data.totalUsers} label="Tổng người dùng" />
            <AdminStatCard icon={<UserPlus className="text-green-500" size={24} />} value={data.newUsersToday} label="Người dùng mới hôm nay" />
            <AdminStatCard icon={<Tv className="text-pink-500" size={24} />} value={data.totalAnime} label="Anime trong DB" />
            <AdminStatCard icon={<BookOpen className="text-purple-500" size={24} />} value={data.totalManga} label="Manga trong DB" />
            <AdminStatCard icon={<Star className="text-yellow-500" size={24} />} value={data.totalReviews} label="Tổng review" />
          </div>

          {leaderboard && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Top người dùng (EXP)</h2>
              <div className="space-y-3">
                {leaderboard.map((entry: any) => (
                  <div key={entry.user?.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-6">#{entry.rank}</span>
                    <img
                      src={entry.user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user?.username}`}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{entry.user?.profile?.displayName || entry.user?.username}</p>
                      <p className="text-xs text-slate-500">{entry.level?.title}</p>
                    </div>
                    <span className="text-sm font-bold text-pink-600">{entry.totalExp} EXP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function AdminStatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">{icon}<span className="text-sm text-slate-500">{label}</span></div>
      <p className="text-3xl font-black text-slate-900 dark:text-white">{value?.toLocaleString()}</p>
    </div>
  );
}
