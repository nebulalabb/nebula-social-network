"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../../lib/api-client";
import { Image as ImageIcon, Upload, Tag } from "lucide-react";

interface CosplayItem {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  images: string[];
  tags: string[];
  createdAt: string;
}

export default function CosplayPage() {
  const [tag, setTag] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cosplay", tag],
    queryFn: () =>
      apiClient.get("/cosplay", { params: { limit: 24, ...(tag ? { tag } : {}) } }).then((r) => r.data?.data ?? []),
  });

  const items: CosplayItem[] = data ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-400" />
            Cosplay Gallery
          </h1>
          <p className="text-gray-400 text-sm mt-1">Showcase cosplay từ cộng đồng</p>
        </div>
        <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          <Upload className="w-4 h-4" />
          Đăng cosplay
        </button>
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "Naruto", "One Piece", "Demon Slayer", "Attack on Titan", "Genshin Impact"].map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              tag === t
                ? "bg-pink-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {t === "" ? "Tất cả" : t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có cosplay nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
            >
              {item.images[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-600" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
                {item.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs bg-pink-600/80 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Multiple images indicator */}
              {item.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  +{item.images.length - 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
