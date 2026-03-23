"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Plus, Loader2, Bell, BellOff, Check, X } from "lucide-react";
import Link from "next/link";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";

const DAYS = [
  { key: "monday", label: "Thứ 2" },
  { key: "tuesday", label: "Thứ 3" },
  { key: "wednesday", label: "Thứ 4" },
  { key: "thursday", label: "Thứ 5" },
  { key: "friday", label: "Thứ 6" },
  { key: "saturday", label: "Thứ 7" },
  { key: "sunday", label: "CN" },
];

const TODAY_KEY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

// Countdown to next airing (simulated — counts down to midnight of next day)
function EpisodeCountdown({ anime }: { anime: any }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // Simulate next episode at a random hour based on mal_id
      const hour = (anime.mal_id % 24);
      const target = new Date();
      target.setHours(hour, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [anime.mal_id]);

  return (
    <span className="text-xs text-green-600 dark:text-green-400 font-mono font-medium flex items-center gap-1">
      <Clock size={10} /> {timeLeft}
    </span>
  );
}

// Add to list modal
function AddToListModal({ anime, onClose }: { anime: any; onClose: () => void }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [status, setStatus] = useState("WATCHING");
  const [episode, setEpisode] = useState(1);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/anime/list", {
        malId: anime.mal_id,
        title: anime.title_english || anime.title,
        image: anime.images?.jpg?.image_url,
        totalEpisodes: anime.episodes || 0,
        status,
        currentEpisode: episode,
      });
    },
    onSuccess: () => {
      toast.success("Đã thêm vào danh sách");
      qc.invalidateQueries({ queryKey: ["anime-list"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Lỗi"),
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Thêm vào danh sách</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="flex gap-3 mb-4">
          <img src={anime.images?.jpg?.image_url} alt="" className="w-14 h-20 object-cover rounded-lg shrink-0" />
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">{anime.title_english || anime.title}</p>
            <p className="text-xs text-slate-500 mt-1">{anime.episodes ? `${anime.episodes} tập` : "Đang chiếu"}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Trạng thái</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: "WATCHING", label: "Đang xem" },
                { value: "PLAN_TO_WATCH", label: "Sẽ xem" },
                { value: "COMPLETED", label: "Đã xem" },
                { value: "ON_HOLD", label: "Tạm dừng" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-medium transition-colors",
                    status === s.value
                      ? "bg-pink-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {status === "WATCHING" && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Tập hiện tại</label>
              <input
                type="number"
                min={1}
                max={anime.episodes || 9999}
                value={episode}
                onChange={(e) => setEpisode(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuthStore();
  const [activeDay, setActiveDay] = useState(TODAY_KEY);
  const [addModal, setAddModal] = useState<any>(null);
  const [notified, setNotified] = useState<Set<number>>(new Set());

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule-weekly"],
    queryFn: async () => {
      const { data } = await apiClient.get("/schedule");
      return data.data;
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: upcoming } = useQuery({
    queryKey: ["schedule-upcoming"],
    queryFn: async () => {
      const { data } = await apiClient.get("/schedule/upcoming");
      return data.data?.items || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const dayAnime = schedule?.[activeDay] || [];

  const toggleNotify = (malId: number) => {
    setNotified((prev) => {
      const next = new Set(prev);
      if (next.has(malId)) { next.delete(malId); toast.info("Đã tắt thông báo"); }
      else { next.add(malId); toast.success("Sẽ thông báo khi có tập mới"); }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Calendar size={24} />
          <div>
            <h1 className="text-xl font-bold">Lịch phát sóng</h1>
            <p className="text-blue-200 text-sm">Anime đang chiếu theo tuần</p>
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
          {DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => setActiveDay(d.key)}
              className={cn(
                "flex-1 min-w-[60px] py-3 text-sm font-medium transition-colors whitespace-nowrap",
                activeDay === d.key
                  ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50 dark:bg-pink-950/20"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                d.key === TODAY_KEY && activeDay !== d.key && "text-blue-500"
              )}
            >
              {d.label}
              {d.key === TODAY_KEY && (
                <span className="block text-[10px] text-blue-500 font-normal">Hôm nay</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-pink-600" size={24} />
            </div>
          ) : dayAnime.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>Không có anime phát sóng ngày này</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAnime.map((anime: any) => (
                <div key={anime.mal_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <Link href={`/anime/${anime.mal_id}`} className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/anime/${anime.mal_id}`}>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white hover:text-pink-600 transition-colors line-clamp-2">
                        {anime.title_english || anime.title}
                      </p>
                    </Link>
                    {anime.title !== anime.title_english && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{anime.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {anime.type && (
                        <span className="text-xs bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                          {anime.type}
                        </span>
                      )}
                      {anime.episodes && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {anime.episodes} tập
                        </span>
                      )}
                      {anime.score && (
                        <span className="text-xs text-yellow-500 font-medium">★ {anime.score}</span>
                      )}
                    </div>
                    {/* Countdown — only show for today */}
                    {activeDay === TODAY_KEY && (
                      <div className="mt-1">
                        <EpisodeCountdown anime={anime} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleNotify(anime.mal_id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        notified.has(anime.mal_id)
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                          : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      )}
                      title="Thông báo tập mới"
                    >
                      {notified.has(anime.mal_id) ? <Bell size={15} /> : <BellOff size={15} />}
                    </button>
                    {user && (
                      <button
                        onClick={() => setAddModal(anime)}
                        className="p-2 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors"
                        title="Thêm vào danh sách"
                      >
                        <Plus size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Sắp ra mắt</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {upcoming.slice(0, 10).map((anime: any) => (
              <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-1.5">
                  <img src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 group-hover:text-pink-600 transition-colors">
                  {anime.title_english || anime.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {addModal && <AddToListModal anime={addModal} onClose={() => setAddModal(null)} />}
    </div>
  );
}
