"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Coins, Loader2, Star, Crown, Sparkles, Package } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "avatar_frame", label: "Khung avatar" },
  { key: "room_item", label: "Vật phẩm phòng" },
  { key: "badge", label: "Huy hiệu" },
  { key: "emote", label: "Emote" },
  { key: "title", label: "Danh hiệu" },
];

// Mock shop items — replace with real API when backend ready
const MOCK_ITEMS = [
  { id: "1", name: "Khung Sakura", category: "avatar_frame", price: 100, rarity: "RARE", imageUrl: null, description: "Khung avatar hoa anh đào" },
  { id: "2", name: "Khung Rồng Vàng", category: "avatar_frame", price: 500, rarity: "LEGENDARY", imageUrl: null, description: "Khung rồng huyền thoại" },
  { id: "3", name: "Bàn Anime", category: "room_item", price: 80, rarity: "COMMON", imageUrl: null, description: "Bàn trang trí phòng 3D" },
  { id: "4", name: "Poster Naruto", category: "room_item", price: 30, rarity: "COMMON", imageUrl: null, description: "Poster treo tường" },
  { id: "5", name: "Huy hiệu Otaku", category: "badge", price: 200, rarity: "RARE", imageUrl: null, description: "Huy hiệu dành cho fan cứng" },
  { id: "6", name: "Emote Kawaii", category: "emote", price: 50, rarity: "COMMON", imageUrl: null, description: "Bộ emote dễ thương" },
  { id: "7", name: "Danh hiệu Senpai", category: "title", price: 150, rarity: "RARE", imageUrl: null, description: "Hiển thị dưới tên" },
  { id: "8", name: "Đèn Lồng Nhật", category: "room_item", price: 60, rarity: "COMMON", imageUrl: null, description: "Đèn trang trí phòng" },
];

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-slate-500",
  RARE: "text-blue-500",
  EPIC: "text-purple-500",
  LEGENDARY: "text-yellow-500",
};

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Thường",
  RARE: "Hiếm",
  EPIC: "Sử thi",
  LEGENDARY: "Huyền thoại",
};

export default function ShopPage() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState("all");
  const qc = useQueryClient();

  const { data: coinBalance } = useQuery({
    queryKey: ["coin-balance"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/me/coins");
      return data.data?.balance ?? 0;
    },
    enabled: !!user,
  });

  const buyMutation = useMutation({
    mutationFn: (itemId: string) => apiClient.post("/shop/buy", { itemId }),
    onSuccess: () => {
      toast.success("Mua thành công!");
      qc.invalidateQueries({ queryKey: ["coin-balance"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Không đủ Coin"),
  });

  const filtered = category === "all" ? MOCK_ITEMS : MOCK_ITEMS.filter((i) => i.category === category);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={24} />
            <div>
              <h1 className="text-xl font-bold">Cửa hàng</h1>
              <p className="text-indigo-200 text-sm">Mua vật phẩm bằng Coin</p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl">
              <Coins size={16} className="text-yellow-300" />
              <span className="font-bold text-sm">{coinBalance ?? "..."}</span>
              <span className="text-xs text-white/70">Coin</span>
            </div>
          )}
        </div>
      </div>

      {/* How to get coins */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cách nhận Coin</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Star, label: "Điểm danh", desc: "+3/ngày" },
            { icon: Crown, label: "Premium", desc: "+50/tháng" },
            { icon: Sparkles, label: "Hoạt động", desc: "+1-10/hành động" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Icon size={18} className="mx-auto text-yellow-500 mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
              <p className="text-[10px] text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              category === key
                ? "bg-purple-600 text-white"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-purple-300 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <Package size={32} className="text-slate-400" />
            </div>
            <div className="p-3">
              <p className={cn("text-[10px] font-semibold mb-0.5", RARITY_COLORS[item.rarity])}>
                {RARITY_LABELS[item.rarity]}
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <Coins size={13} className="text-yellow-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.price}</span>
                </div>
                <button
                  onClick={() => buyMutation.mutate(item.id)}
                  disabled={buyMutation.isPending || !user}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Mua
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
