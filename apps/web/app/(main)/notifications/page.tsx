"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, Check, Trash2, Loader2, Heart, MessageCircle, UserPlus, Users, AtSign } from "lucide-react";
import Link from "next/link";
import apiClient from "../../../lib/api-client";
import { useNotificationStore } from "../../../store/use-notification-store";
import { cn } from "../../../lib/utils";

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  LIKE: { icon: Heart, color: "text-red-500 bg-red-50 dark:bg-red-950/20", label: "đã thích bài đăng của bạn" },
  COMMENT: { icon: MessageCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20", label: "đã bình luận bài đăng của bạn" },
  REPLY: { icon: MessageCircle, color: "text-blue-400 bg-blue-50 dark:bg-blue-950/20", label: "đã trả lời bình luận của bạn" },
  MENTION: { icon: AtSign, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20", label: "đã nhắc đến bạn" },
  FRIEND_REQUEST: { icon: UserPlus, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20", label: "đã gửi lời mời kết bạn" },
  FRIEND_ACCEPT: { icon: Users, color: "text-green-500 bg-green-50 dark:bg-green-950/20", label: "đã chấp nhận lời mời kết bạn" },
  FOLLOW: { icon: UserPlus, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20", label: "đã theo dõi bạn" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { setNotifications, markAllRead } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await apiClient.get("/notifications");
      return data.data;
    },
  });

  useEffect(() => {
    if (data?.notifications) setNotifications(data.notifications);
  }, [data]);

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.put("/notifications/read-all"),
    onSuccess: () => { markAllRead(); qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.notifications || [];
  const unread = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-pink-600" />
            <h1 className="font-bold text-slate-900 dark:text-white">Thông báo</h1>
            {unread > 0 && (
              <span className="bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-pink-600 transition-colors"
            >
              <Check size={13} /> Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-pink-600" size={24} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n: any) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.LIKE;
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                    !n.isRead && "bg-pink-50/50 dark:bg-pink-950/10"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center">
                      {n.actor?.profile?.avatarUrl ? (
                        <img src={n.actor.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {(n.actor?.profile?.displayName || n.actor?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center", config.color)}>
                      <Icon size={11} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <Link href={`/profile/${n.actor?.username}`} className="font-semibold hover:text-pink-600">
                        {n.actor?.profile?.displayName || n.actor?.username}
                      </Link>{" "}
                      {config.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={() => markOneMutation.mutate(n.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
