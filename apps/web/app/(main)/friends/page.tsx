"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import apiClient from "../../../lib/api-client";

const TABS = ["Bạn bè", "Lời mời", "Gợi ý"] as const;
type Tab = (typeof TABS)[number];

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("Bạn bè");
  const qc = useQueryClient();

  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => { const { data } = await apiClient.get("/social/friends"); return data.data; },
    enabled: tab === "Bạn bè",
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => { const { data } = await apiClient.get("/social/friend-requests"); return data.data; },
    enabled: tab === "Lời mời",
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["friend-suggestions-page"],
    queryFn: async () => { const { data } = await apiClient.get("/social/suggestions"); return data.data; },
    enabled: tab === "Gợi ý",
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      apiClient.put(`/social/friend-request/${id}`, { accept }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friend-requests"] }),
  });

  const addFriendMutation = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/social/friend-request/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friend-suggestions-page"] }),
  });

  const unfriendMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/social/friends/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-pink-600" />
            <h1 className="font-bold text-slate-900 dark:text-white">Bạn bè</h1>
          </div>
        </div>
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? "text-pink-600 border-b-2 border-pink-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t}
              {t === "Lời mời" && requests?.length > 0 && (
                <span className="ml-1.5 bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "Bạn bè" && (
            loadingFriends ? <LoadingSpinner /> :
            friends?.length === 0 ? <EmptyState text="Chưa có bạn bè nào" /> :
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends?.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <UserAvatar user={f} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${f.username}`} className="font-medium text-sm text-slate-800 dark:text-slate-200 hover:text-pink-600 truncate block">
                      {f.profile?.displayName || f.username}
                    </Link>
                    <p className="text-xs text-slate-500">@{f.username}</p>
                  </div>
                  <button
                    onClick={() => unfriendMutation.mutate(f.id)}
                    className="text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Hủy kết bạn
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "Lời mời" && (
            loadingRequests ? <LoadingSpinner /> :
            requests?.length === 0 ? <EmptyState text="Không có lời mời nào" /> :
            <div className="space-y-3">
              {requests?.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <UserAvatar user={r.sender} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${r.sender.username}`} className="font-medium text-sm text-slate-800 dark:text-slate-200 hover:text-pink-600 truncate block">
                      {r.sender.profile?.displayName || r.sender.username}
                    </Link>
                    <p className="text-xs text-slate-500">@{r.sender.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondMutation.mutate({ id: r.id, accept: true })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <Check size={12} /> Chấp nhận
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: r.id, accept: false })}
                      className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} /> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Gợi ý" && (
            loadingSuggestions ? <LoadingSpinner /> :
            suggestions?.length === 0 ? <EmptyState text="Không có gợi ý nào" /> :
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <UserAvatar user={u} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${u.username}`} className="font-medium text-sm text-slate-800 dark:text-slate-200 hover:text-pink-600 truncate block">
                      {u.profile?.displayName || u.username}
                    </Link>
                    {u.commonAnime > 0 && <p className="text-xs text-slate-500">{u.commonAnime} anime chung</p>}
                  </div>
                  <button
                    onClick={() => addFriendMutation.mutate(u.id)}
                    disabled={addFriendMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
                  >
                    <UserPlus size={12} /> Kết bạn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: any }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
      {user?.profile?.avatarUrl ? (
        <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white text-sm font-bold">
          {(user?.profile?.displayName || user?.username || "?")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={24} /></div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-slate-500 text-sm py-8">{text}</p>;
}
