"use client";

import Link from "next/link";
import { Star } from "lucide-react";

interface AnimeCardProps {
  id: string | number;
  title: string;
  imageUrl?: string;
  score?: number;
  type?: string;
  episodes?: number;
  size?: "sm" | "md";
}

export function AnimeCard({ id, title, imageUrl, score, type, episodes, size = "md" }: AnimeCardProps) {
  const isSmall = size === "sm";

  return (
    <Link href={`/anime/${id}`} className="group block">
      <div className={`relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 ${isSmall ? "aspect-[2/3]" : "aspect-[2/3]"}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400/20 to-purple-600/20">
            <span className="text-slate-400 text-xs text-center px-2">{title}</span>
          </div>
        )}
        {score && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-lg">
            <Star size={10} fill="currentColor" />
            {score.toFixed(1)}
          </div>
        )}
      </div>
      <p className={`mt-1.5 font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight ${isSmall ? "text-xs" : "text-sm"}`}>
        {title}
      </p>
      {(type || episodes) && (
        <p className="text-xs text-slate-500 mt-0.5">
          {type}{type && episodes ? " · " : ""}{episodes ? `${episodes} tập` : ""}
        </p>
      )}
    </Link>
  );
}
