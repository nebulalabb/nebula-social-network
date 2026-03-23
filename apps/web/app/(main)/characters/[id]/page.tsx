"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart, Star, Users, BookOpen, Tv, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import apiClient from "../../../../lib/api-client";

async function fetchCharacter(id: string) {
  // Try Jikan API for character data
  const res = await fetch(`https://api.jikan.moe/v4/characters/${id}/full`);
  if (!res.ok) throw new Error("Not found");
  const json = await res.json();
  return json.data;
}

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();

  const { data: char, isLoading, isError } = useQuery({
    queryKey: ["character", id],
    queryFn: () => fetchCharacter(id),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-pink-600" size={28} />
    </div>
  );

  if (isError || !char) return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
      <p className="text-slate-500">Không tìm thấy nhân vật này.</p>
      <Link href="/anime" className="mt-4 inline-flex items-center gap-2 text-pink-600 text-sm hover:underline">
        <ArrowLeft size={14} /> Quay lại
      </Link>
    </div>
  );

  const animeography = char.anime?.slice(0, 6) || [];
  const mangaography = char.manga?.slice(0, 4) || [];
  const voiceActors = char.voices?.slice(0, 4) || [];

  return (
    <div className="space-y-4">
      <Link href="javascript:history.back()" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-pink-600 transition-colors">
        <ArrowLeft size={14} /> Quay lại
      </Link>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-pink-400 to-purple-600" />
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-900 overflow-hidden bg-slate-200 shrink-0 shadow-lg">
              {char.images?.jpg?.image_url && (
                <img src={char.images.jpg.image_url} alt={char.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{char.name}</h1>
              {char.name_kanji && <p className="text-sm text-slate-500">{char.name_kanji}</p>}
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-pink-600 font-medium">
                  <Heart size={14} fill="currentColor" /> {char.favorites?.toLocaleString() || 0} yêu thích
                </span>
              </div>
            </div>
          </div>

          {char.about && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Giới thiệu</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-6 whitespace-pre-line">
                {char.about}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animeography */}
      {animeography.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Tv size={15} className="text-pink-500" /> Xuất hiện trong Anime
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {animeography.map((entry: any) => (
              <Link key={entry.anime?.mal_id} href={`/anime/${entry.anime?.mal_id}`} className="group text-center">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-1.5">
                  {entry.anime?.images?.jpg?.image_url && (
                    <img src={entry.anime.images.jpg.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">{entry.anime?.title}</p>
                <p className="text-[10px] text-pink-500 mt-0.5">{entry.role}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mangaography */}
      {mangaography.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <BookOpen size={15} className="text-purple-500" /> Xuất hiện trong Manga
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {mangaography.map((entry: any) => (
              <Link key={entry.manga?.mal_id} href={`/manga/${entry.manga?.mal_id}`} className="group text-center">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-1.5">
                  {entry.manga?.images?.jpg?.image_url && (
                    <img src={entry.manga.images.jpg.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">{entry.manga?.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Voice Actors */}
      {voiceActors.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Users size={15} className="text-blue-500" /> Diễn viên lồng tiếng
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {voiceActors.map((va: any) => (
              <div key={va.person?.mal_id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  {va.person?.images?.jpg?.image_url && (
                    <img src={va.person.images.jpg.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{va.person?.name}</p>
                  <p className="text-[10px] text-slate-500">{va.language}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
