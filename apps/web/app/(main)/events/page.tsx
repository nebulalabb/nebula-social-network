"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Users, Clock, Trophy, Tv, MessageSquare, Loader2, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

const EVENT_TYPES = [
  { value: "ALL", label: "Tất cả" },
  { value: "QUIZ", label: "Quiz" },
  { value: "FANART_CONTEST", label: "Thi Fanart" },
  { value: "WATCH_PARTY", label: "Watch Party" },
  { value: "DISCUSSION", label: "Thảo luận" },
  { value: "OTHER", label: "Khác" },
];

const TYPE_ICONS: Record<string, any> = {
  QUIZ: Trophy,
  FANART_CONTEST: Tv,
  WATCH_PARTY: Tv,
  DISCUSSION: MessageSquare,
  OTHER: CalendarDays,
};

const TYPE_COLORS: Record<string, string> = {
  QUIZ: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400",
  FANART_CONTEST: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  WATCH_PARTY: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  DISCUSSION: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400",
  OTHER: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 dark:bg-blue-950/30 text-blue-600",
  ONGOING: "bg-green-100 dark:bg-green-950/30 text-green-600",
  ENDED: "bg-slate-100 dark:bg-slate-800 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Sắp diễn ra",
  ONGOING: "Đang diễn ra",
  ENDED: "Đã kết thúc",
};

export default function EventsPage() {
  const { user } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["events", typeFilter],
    queryFn: async () => {
      const params: any = {};
      if (typeFilter !== "ALL") params.type = typeFilter;
      const { data } = await apiClient.get("/events", { params });
      return data.data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: (eventId: string) => apiClient.post(`/events/${eventId}/join`),
    onSuccess: () => { toast.success("Đã đăng ký tham gia"); qc.invalidateQueries({ queryKey: ["events"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Lỗi"),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays size={24} />
            <div>
              <h1 className="text-xl font-bold">Sự kiện</h1>
              <p className="text-green-100 text-sm">Tham gia các hoạt động cộng đồng</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={16} /> Tạo sự kiện
            </button>
          )}
        </div>
      </div>

      {/* Type filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                typeFilter === t.value ? "bg-pink-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
      ) : data?.events?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có sự kiện nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.events?.map((event: any) => {
            const TypeIcon = TYPE_ICONS[event.type] || CalendarDays;
            const isParticipant = event.participants?.includes(user?.id);

            return (
              <div key={event._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-pink-300 dark:hover:border-pink-800 transition-colors">
                {event.imageUrl && (
                  <div className="h-32 overflow-hidden">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{event.title}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[event.status])}>
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{event.description}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", TYPE_COLORS[event.type])}>
                      <TypeIcon size={11} />
                      {EVENT_TYPES.find((t) => t.value === event.type)?.label || event.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {event.participants?.length || 0}
                      {event.maxParticipants ? `/${event.maxParticipants}` : ""} người
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <Clock size={11} />
                    {event.startDate && format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}
                    {event.endDate && ` — ${format(new Date(event.endDate), "dd/MM/yyyy HH:mm")}`}
                  </div>

                  {user && event.status !== "ENDED" && (
                    <button
                      onClick={() => !isParticipant && joinMutation.mutate(event._id)}
                      disabled={isParticipant || joinMutation.isPending}
                      className={cn(
                        "w-full py-2 rounded-xl text-sm font-medium transition-colors",
                        isParticipant
                          ? "bg-green-100 dark:bg-green-950/30 text-green-600 cursor-default"
                          : "bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50"
                      )}
                    >
                      {isParticipant ? "Đã đăng ký" : "Tham gia"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["events"] }); }}
        />
      )}
    </div>
  );
}

function CreateEventModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", type: "OTHER",
    startDate: "", endDate: "", maxParticipants: "", isPublic: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return toast.error("Vui lòng điền đầy đủ thông tin");
    setLoading(true);
    try {
      await apiClient.post("/events", {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      });
      toast.success("Tạo sự kiện thành công");
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi tạo sự kiện");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo sự kiện</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Tên sự kiện *", key: "title", placeholder: "Tên sự kiện..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mô tả *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả sự kiện..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Loại sự kiện</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {EVENT_TYPES.filter((t) => t.value !== "ALL").map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Bắt đầu *</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Kết thúc *</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Số người tối đa (để trống = không giới hạn)</label>
            <input
              type="number"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
              placeholder="100"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Đang tạo..." : "Tạo sự kiện"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
