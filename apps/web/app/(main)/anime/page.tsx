"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, BookOpen, Eye, CheckCircle2, Clock, XCircle,
  ListPlus, Star, TrendingUp, Calendar, Tv, ChevronDown, X, Plus
} from "lucide-react";
import apiClient from "../../../lib/api-client";
import { AnimeCard } from "../../../components/profile/anime-card";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthStore } from "../../../store/use-auth-store";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type BrowseTab = "Tất cả" | "Mùa này" | "Đang chiếu" | "Top";
type TrackerStatus = "WATCHING" | "COMPLETED" | "ON_HOLD" | "DROPPED" | "PLAN_TO_WATCH";
type MainTab = "browse" | "tracker";

const BROWSE_TABS: BrowseTab[] = ["Tất cả", "Mùa này", "Đang chiếu", "Top"];

const TRACKER_STATUSES: { key: TrackerStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "WATCHING",      label: "Đang xem",     icon: <Eye size={14} />,         color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  { key: "COMPLETED",     label: "Đã xem",        icon: <CheckCircle2 size={14} />, color: "text-green-500 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  { key: "PLAN_TO_WATCH", label: "Dự định xem",   icon: <Clock size={14} />,        color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
  { key: "ON_HOLD",       label: "Tạm dừng",      icon: <BookOpen size={14} />,     color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" },
  { key: "DROPPED",       label: "Bỏ dở",         icon: <XCircle size={14} />,      color: "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
];

// ── Add to list modal ─────────────────────────────────────────────────────────
function AddToListModal({
  anime,
  existing,
  onClose,
}: {
  anime: any;
  existing?: { status: TrackerStatus; score?: number; progress?: number };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TrackerStatus>(existing?.status ?? "PLAN_TO_WATCH");
  const [score, setScore] = useState<number>(existing?.score ?? 0);
  const [progress, setProgress] = useState<number>(existing?.progress ?? 0);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/anime/list/${anime.mal_id}`, {
        status,
        score: score || undefined,
        progress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-anime-list"] });
      toast.success("Đã cập nhật danh sách");
      onClose();
    },
    onError: () => toast.error("Có lỗi xảy ra"),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/anime/list/${anime.mal_id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-anime-list"] });
      toast.success("Đã xóa khỏi danh sách");
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
            {anime.images?.jpg?.image_url && (
              <img src={anime.images.jpg.image_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">
              {anime.title_english || anime.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{anime.type} · {anime.episodes ?? "?"} tập</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Trạng thái</label>
            <div className="grid grid-cols-1 gap-1.5">
              {TRACKER_STATUSES.map(({ key, label, icon, color }) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                    status === key ? color : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {icon} {label}
                  {status === key && <CheckCircle2 size={13} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
              Điểm của bạn: {score > 0 ? score : "Chưa chấm"}
            </label>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(score === n ? 0 : n)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                    score >= n
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-yellow-100"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {anime.episodes && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                Tiến độ: {progress}/{anime.episodes} tập
              </label>
              <input
                type="range"
                min={0}
                max={anime.episodes}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 pt-0">
          {existing && (
            <button
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Xóa
            </button>
          )}
          <button
            onClick={() => upsertMutation.mutate()}
            disabled={upsertMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            {upsertMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Anime card with tracker button ────────────────────────────────────────────
function AnimeCardWithTracker({
  anime,
  myList,
  onAddClick,
}: {
  anime: any;
  myList?: Map<string, any>;
  onAddClick: (anime: any) => void;
}) {
  const existing = myList?.get(String(anime.mal_id));
  const statusInfo = existing ? TRACKER_STATUSES.find((s) => s.key === existing.status) : null;

  return (
    <div className="group relative">
      <AnimeCard
        id={anime.mal_id}
        title={anime.title_english || anime.title}
        imageUrl={anime.images?.jpg?.image_url}
        score={anime.score}
        type={anime.type}
        episodes={anime.episodes}
      />
      {/* Tracker overlay button */}
      <button
        onClick={(e) => { e.preventDefault(); onAddClick(anime); }}
        className={cn(
          "absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all",
          statusInfo
            ? "bg-black/70 text-white opacity-100"
            : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
        )}
      >
        {statusInfo ? statusInfo.icon : <Plus size={10} />}
        {statusInfo ? statusInfo.label.split(" ")[0] : "Thêm"}
      </button>
    </div>
  );
}

// ── Tracker tab ───────────────────────────────────────────────────────────────
function TrackerTab({ myList }: { myList: any[] }) {
  const [activeStatus, setActiveStatus] = useState<TrackerStatus | "ALL">("ALL");

  const filtered = activeStatus === "ALL"
    ? myList
    : myList.filter((item) => item.status === activeStatus);

  const counts = TRACKER_STATUSES.reduce((acc, { key }) => {
    acc[key] = myList.filter((i) => i.status === key).length;
    return acc;
  }, {} as Record<TrackerStatus, number>);

  // Stats
  const completed = myList.filter((i) => i.status === "COMPLETED").length;
  const watching = myList.filter((i) => i.status === "WATCHING").length;
  const avgScore = myList.filter((i) => i.score > 0).reduce((s, i) => s + i.score, 0) /
    (myList.filter((i) => i.score > 0).length || 1);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tổng", value: myList.length, icon: <ListPlus size={16} />, color: "text-pink-600" },
          { label: "Đã xem", value: completed, icon: <CheckCircle2 size={16} />, color: "text-green-600" },
          { label: "Đang xem", value: watching, icon: <Eye size={16} />, color: "text-blue-600" },
          { label: "Điểm TB", value: avgScore > 0 ? avgScore.toFixed(1) : "—", icon: <Star size={16} />, color: "text-yellow-500" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-center">
            <div className={cn("flex justify-center mb-1", color)}>{icon}</div>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveStatus("ALL")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
              activeStatus === "ALL"
                ? "bg-pink-600 text-white border-pink-600"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Tất cả ({myList.length})
          </button>
          {TRACKER_STATUSES.map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveStatus(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                activeStatus === key ? color : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {icon} {label} ({counts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <ListPlus size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Danh sách trống</p>
            <p className="text-xs mt-1">Thêm anime từ tab Khám phá</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filtered.map((item: any) => {
              const statusInfo = TRACKER_STATUSES.find((s) => s.key === item.status);
              return (
                <div key={item.id} className="group relative">
                  <AnimeCard
                    id={item.anime?.malId || item.animeId}
                    title={item.anime?.titleEn || item.anime?.title || "Unknown"}
                    imageUrl={item.anime?.images?.jpg?.image_url}
                    score={item.score || undefined}
                    size="sm"
                  />
                  {/* Status badge */}
                  {statusInfo && (
                    <div className={cn("absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold border", statusInfo.color)}>
                      {statusInfo.icon}
                    </div>
                  )}
                  {/* Progress bar */}
                  {item.progress > 0 && item.anime?.episodes && (
                    <div className="mt-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 rounded-full"
                        style={{ width: `${Math.min(100, (item.progress / item.anime.episodes) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnimePage() {
  const { user } = useAuthStore();
  const [mainTab, setMainTab] = useState<MainTab>("browse");
  const [browseTab, setBrowseTab] = useState<BrowseTab>("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState<any | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["anime-browse", browseTab, debouncedSearch, page],
    queryFn: async () => {
      if (debouncedSearch) {
        const { data } = await apiClient.get(`/anime/search?q=${debouncedSearch}&page=${page}`);
        return data.data;
      }
      if (browseTab === "Mùa này") {
        const { data } = await apiClient.get("/anime/seasonal");
        return data.data;
      }
      if (browseTab === "Top") {
        const { data } = await apiClient.get(`/anime/top?page=${page}`);
        return data.data;
      }
      const status = browseTab === "Đang chiếu" ? "airing" : undefined;
      const { data } = await apiClient.get("/anime", { params: { status, page } });
      return data.data;
    },
    enabled: mainTab === "browse",
  });

  const { data: myListData } = useQuery({
    queryKey: ["my-anime-list"],
    queryFn: async () => {
      const { data } = await apiClient.get("/anime/me/list");
      return data.data as any[];
    },
    enabled: !!user,
  });

  const myListMap = new Map(
    (myListData ?? []).map((item: any) => [String(item.animeId), item])
  );

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tv size={20} className="text-pink-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Anime</h1>
          </div>
          {/* Main tab toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMainTab("browse")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                mainTab === "browse" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
              )}
            >
              <TrendingUp size={13} /> Khám phá
            </button>
            {user && (
              <button
                onClick={() => setMainTab("tracker")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  mainTab === "tracker" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                )}
              >
                <ListPlus size={13} /> Danh sách của tôi
                {myListData && myListData.length > 0 && (
                  <span className="bg-pink-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {myListData.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {mainTab === "browse" && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm anime..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        )}
      </div>

      {/* Browse tab */}
      {mainTab === "browse" && (
        <>
          {!debouncedSearch && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                {BROWSE_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setBrowseTab(t); setPage(1); }}
                    className={cn(
                      "flex-1 py-3 text-sm font-medium transition-colors",
                      browseTab === t
                        ? "text-pink-600 border-b-2 border-pink-600"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-pink-600" size={28} />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-12">Không tìm thấy kết quả</p>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {items.map((anime: any) => (
                    <AnimeCardWithTracker
                      key={anime.mal_id}
                      anime={anime}
                      myList={user ? myListMap : undefined}
                      onAddClick={user ? setAddModal : () => toast.error("Đăng nhập để thêm vào danh sách")}
                    />
                  ))}
                </div>

                {data?.pagination && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Trang {page}</span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.pagination.has_next_page}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Tracker tab */}
      {mainTab === "tracker" && user && (
        <TrackerTab myList={myListData ?? []} />
      )}

      {/* Add to list modal */}
      {addModal && (
        <AddToListModal
          anime={addModal}
          existing={myListMap.get(String(addModal.mal_id))}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}
