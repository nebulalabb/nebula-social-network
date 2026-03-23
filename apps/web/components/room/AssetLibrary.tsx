"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { X, Search } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string;
  modelUrl: string;
  scale: number;
}

interface AssetLibraryProps {
  onSelect: (asset: Asset) => void;
  onClose: () => void;
}

const CATEGORIES = ["Tất cả", "Ghế", "Bàn", "Trang trí", "Cây", "Ánh sáng", "Khác"];

export default function AssetLibrary({ onSelect, onClose }: AssetLibraryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");

  const { data, isLoading } = useQuery({
    queryKey: ["room-assets"],
    queryFn: () => apiClient.get("/rooms/assets").then((r) => r.data?.data ?? []),
  });

  const assets: Asset[] = data ?? [];
  const filtered = assets.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Tất cả" || a.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden w-72">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-semibold text-sm">Thư viện đồ vật</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-white/10">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full bg-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2 outline-none placeholder:text-slate-500 focus:bg-white/15"
          />
        </div>
      </div>

      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-white/10 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors ${
              category === cat
                ? "bg-pink-600 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
        {isLoading ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-8">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-8">Không tìm thấy đồ vật</div>
        ) : (
          filtered.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onSelect(asset)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-pink-500/50 transition-all group"
            >
              <div className="w-full aspect-square rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                {asset.thumbnailUrl ? (
                  <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <span className="text-xs text-slate-300 group-hover:text-white text-center leading-tight line-clamp-2">
                {asset.name}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
