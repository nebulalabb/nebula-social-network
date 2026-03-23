"use client";

import Link from "next/link";
import { MapPin, Link as LinkIcon, Calendar, UserPlus, MessageSquare, Ban } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { useAuthStore } from "../../store/use-auth-store";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  username: string;
  profile: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
    website?: string;
    birthday?: string;
    socialLinks?: Record<string, string>;
    totalWatchHours?: number;
    totalChaptersRead?: number;
  } | null;
  _count?: {
    followers: number;
    follows: number;
    friendships: number;
  };
  isFollowing?: boolean;
  isFriend?: boolean;
  friendRequestSent?: boolean;
  isBlocked?: boolean;
}

export function ProfileHeader({ profile }: { profile: ProfileData }) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwn = currentUser?.id === profile.id;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile.isFollowing) {
        await apiClient.delete(`/social/follow/${profile.id}`);
      } else {
        await apiClient.post(`/social/follow/${profile.id}`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", profile.username] }),
  });

  const friendMutation = useMutation({
    mutationFn: async () => {
      if (!profile.isFriend && !profile.friendRequestSent) {
        await apiClient.post(`/social/friend-request/${profile.id}`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", profile.username] }),
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (profile.isBlocked) {
        await apiClient.delete(`/users/block/${profile.id}`);
      } else {
        await apiClient.post(`/users/block/${profile.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      toast.success(profile.isBlocked ? "Đã bỏ chặn người dùng" : "Đã chặn người dùng");
    },
  });

  const p = profile.profile;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 relative">
        {p?.bannerUrl && (
          <img src={p.bannerUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Avatar + Actions */}
      <div className="px-6 pb-4">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden shrink-0">
            {p?.avatarUrl ? (
              <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {(p?.displayName || profile.username)[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-14">
            {isOwn ? (
              <Link
                href="/settings/profile"
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Chỉnh sửa hồ sơ
              </Link>
            ) : (
              <>
                <button
                  onClick={() => friendMutation.mutate()}
                  disabled={profile.isFriend || profile.friendRequestSent}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    profile.isFriend
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      : profile.friendRequestSent
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      : "bg-pink-600 text-white hover:bg-pink-700"
                  )}
                >
                  <UserPlus size={15} />
                  {profile.isFriend ? "Bạn bè" : profile.friendRequestSent ? "Đã gửi lời mời" : "Kết bạn"}
                </button>
                <button
                  onClick={() => followMutation.mutate()}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                    profile.isFollowing
                      ? "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      : "border-pink-600 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                  )}
                >
                  {profile.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </button>
                <Link
                  href={`/messages?user=${profile.username}`}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <MessageSquare size={18} />
                </Link>
                <button
                  onClick={() => blockMutation.mutate()}
                  title={profile.isBlocked ? "Bỏ chặn" : "Chặn người dùng"}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Ban size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {p?.displayName || profile.username}
          </h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>

          {p?.bio && (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{p.bio}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {p?.location && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={13} /> {p.location}
              </span>
            )}
            {p?.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-pink-600 hover:underline"
              >
                <LinkIcon size={13} /> {p.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {p?.birthday && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar size={13} />
                {format(new Date(p.birthday), "dd/MM/yyyy", { locale: vi })}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white">{profile._count?.friendships || 0}</p>
              <p className="text-xs text-slate-500">Bạn bè</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white">{profile._count?.followers || 0}</p>
              <p className="text-xs text-slate-500">Người theo dõi</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white">{profile._count?.follows || 0}</p>
              <p className="text-xs text-slate-500">Đang theo dõi</p>
            </div>
            {p?.totalWatchHours !== undefined && (
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{Math.round(p.totalWatchHours)}h</p>
                <p className="text-xs text-slate-500">Đã xem</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
