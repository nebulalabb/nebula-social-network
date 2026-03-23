"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Lock, Globe, Loader2, Crown } from "lucide-react";
import Link from "next/link";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";
import { toast } from "sonner";

const CATEGORIES = ["ALL", "ANIME", "MANGA", "COSPLAY", "FANART", "GENERAL"];

export default function ClubsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clubs", category, search],
    queryFn: async () => {
      const { data } = await apiClient.get("/clubs", { params: { category, search: search || undefined } });
      return data.data;
    },
  });

  const { data: myClubs } = useQuery({
    queryKey: ["my-clubs"],
    queryFn: async () => {
      const { data } = await apiClient.get("/clubs/me");
      return data.data;
    },
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: (clubId: string) => apiClient.post(`/clubs/${clubId}/join`),
    onSuccess: () => { toast.success("Đã tham gia club"); qc.invalidateQueries({ queryKey: ["clubs"] }); qc.invalidateQueries({ queryKey: ["my-clubs"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Lỗi"),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Clubs</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tham gia cộng đồng cùng sở thích</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={16} /> Tạo Club
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm club..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-pink-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat === "ALL" ? "Tất cả" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* My clubs */}
      {myClubs?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Club của bạn</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {myClubs.map((m: any) => (
              <Link
                key={m.club.id}
                href={`/clubs/${m.club.id}`}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors w-24"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center">
                  {m.club.avatarUrl ? (
                    <img src={m.club.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={20} className="text-white" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center line-clamp-2">{m.club.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Club list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.clubs?.map((club: any) => {
            const isMember = myClubs?.some((m: any) => m.club.id === club.id);
            return (
              <div key={club.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-pink-300 dark:hover:border-pink-800 transition-colors">
                {/* Banner */}
                <div className="h-20 bg-gradient-to-br from-pink-400 to-purple-600 relative">
                  {club.bannerUrl && <img src={club.bannerUrl} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute top-2 right-2">
                    {club.isPrivate ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full">
                        <Lock size={10} /> Riêng tư
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full">
                        <Globe size={10} /> Công khai
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center -mt-8 border-2 border-white dark:border-slate-900 shrink-0">
                      {club.avatarUrl ? (
                        <img src={club.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={18} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/clubs/${club.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-pink-600 transition-colors line-clamp-1">
                        {club.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{club._count?.members || 0} thành viên · {club.category}</p>
                    </div>
                  </div>

                  {club.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{club.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      {club.owner?.profile?.avatarUrl ? (
                        <img src={club.owner.profile.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                          <Crown size={10} className="text-white" />
                        </div>
                      )}
                      <span className="text-xs text-slate-500">{club.owner?.profile?.displayName || club.owner?.username}</span>
                    </div>

                    {user && !isMember && (
                      <button
                        onClick={() => joinMutation.mutate(club.id)}
                        disabled={joinMutation.isPending}
                        className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Tham gia
                      </button>
                    )}
                    {isMember && (
                      <Link href={`/clubs/${club.id}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Xem
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.clubs?.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có club nào. Hãy tạo club đầu tiên!</p>
        </div>
      )}

      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["clubs"] }); qc.invalidateQueries({ queryKey: ["my-clubs"] }); }} />}
    </div>
  );
}

function CreateClubModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", category: "GENERAL", isPrivate: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await apiClient.post("/clubs", form);
      toast.success("Tạo club thành công");
      onCreated();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi tạo club");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tạo Club mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tên Club *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tên club..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả về club..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Danh mục</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {["GENERAL", "ANIME", "MANGA", "COSPLAY", "FANART"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Club riêng tư</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Đang tạo..." : "Tạo Club"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
