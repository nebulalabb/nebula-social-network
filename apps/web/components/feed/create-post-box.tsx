"use client";

import { useState, useRef } from "react";
import { Image, AlertTriangle, X, Globe, Users, Lock, Tv, Search, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/utils";
import apiClient from "../../lib/api-client";
import { toast } from "sonner";

type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

const VISIBILITY_OPTIONS: { value: Visibility; icon: any; label: string }[] = [
  { value: "PUBLIC", icon: Globe, label: "Công khai" },
  { value: "FRIENDS", icon: Users, label: "Bạn bè" },
  { value: "PRIVATE", icon: Lock, label: "Chỉ mình tôi" },
];

// Anime tag picker
function AnimeTagPicker({ onSelect, onClose }: { onSelect: (anime: any) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["anime-search-tag", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data } = await apiClient.get(`/anime/search?q=${encodeURIComponent(search)}&limit=6`);
      return data.data?.items || [];
    },
    enabled: search.length >= 2,
    staleTime: 30_000,
  });

  return (
    <div className="absolute bottom-full left-0 mb-1 bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-xl z-30 w-72 overflow-hidden">
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm anime để tag..."
            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white/5 text-sm text-white/80 placeholder-white/25 focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-white/30" /></div>
        ) : data?.length === 0 && search.length >= 2 ? (
          <p className="text-xs text-white/30 text-center py-4">Không tìm thấy</p>
        ) : data?.map((anime: any) => (
          <button
            key={anime.mal_id}
            onClick={() => { onSelect(anime); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
          >
            <img src={anime.images?.jpg?.image_url} alt="" className="w-8 h-11 object-cover rounded-lg shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/80 line-clamp-1">{anime.title_english || anime.title}</p>
              <p className="text-[10px] text-white/30">{anime.type} · {anime.score ? `★ ${anime.score}` : ""}</p>
            </div>
          </button>
        ))}
        {!search && (
          <p className="text-xs text-white/30 text-center py-4">Nhập tên anime để tìm kiếm</p>
        )}
      </div>
    </div>
  );
}

export function CreatePostBox({ user }: { user: any }) {
  const [content, setContent] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [showVisibility, setShowVisibility] = useState(false);
  const [showAnimePicker, setShowAnimePicker] = useState(false);
  const [taggedAnime, setTaggedAnime] = useState<any[]>([]);
  const [previews, setPreviews] = useState<{ file: File; url: string; type: "IMAGE" | "VIDEO" }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const hashtags = (content.match(/#(\w+)/g) || []).map((h: string) => h.slice(1));
      const { data } = await apiClient.post("/posts", {
        content,
        hashtags,
        hasSpoiler: isSpoiler,
        visibility,
        taggedAnime: taggedAnime.map((a) => ({ malId: a.mal_id, title: a.title_english || a.title, image: a.images?.jpg?.image_url })),
      });
      return data.data;
    },
    onSuccess: () => {
      setContent("");
      setIsSpoiler(false);
      setPreviews([]);
      setTaggedAnime([]);
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Đã đăng bài thành công");
    },
    onError: () => toast.error("Đăng bài thất bại, thử lại nhé"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "VIDEO" as const : "IMAGE" as const,
    }));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 4));
  };

  const currentVisibility = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;

  return (
    <div className="feed-card rounded-2xl p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
          {user?.profile?.avatarUrl ? (
            <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (user?.username?.[0] || "A").toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì về anime hôm nay?"
            rows={3}
            className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/25 resize-none focus:outline-none"
          />

          {/* Tagged anime chips */}
          {taggedAnime.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {taggedAnime.map((a) => (
                <div key={a.mal_id} className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full">
                  <img src={a.images?.jpg?.image_url} alt="" className="w-4 h-4 rounded object-cover" />
                  <span className="text-xs text-pink-300 font-medium">{a.title_english || a.title}</span>
                  <button onClick={() => setTaggedAnime((prev) => prev.filter((x) => x.mal_id !== a.mal_id))} className="text-pink-400/60 hover:text-pink-400">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image previews */}
          {previews.length > 0 && (
            <div className={cn("grid gap-1.5 mb-3 rounded-xl overflow-hidden", previews.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-video bg-white/5 rounded-lg overflow-hidden">
                  {p.type === "IMAGE" ? (
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={p.url} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => setPreviews((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-lg text-white/30 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                title="Thêm ảnh"
              >
                <Image size={18} />
              </button>
              <button
                onClick={() => setIsSpoiler(!isSpoiler)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isSpoiler ? "text-orange-400 bg-orange-500/10" : "text-white/30 hover:text-orange-400 hover:bg-orange-500/10"
                )}
                title="Spoiler tag"
              >
                <AlertTriangle size={18} />
              </button>

              {/* Anime tag picker */}
              <div className="relative">
                <button
                  onClick={() => setShowAnimePicker(!showAnimePicker)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    taggedAnime.length > 0 ? "text-pink-400 bg-pink-500/10" : "text-white/30 hover:text-pink-400 hover:bg-pink-500/10"
                  )}
                  title="Tag anime"
                >
                  <Tv size={18} />
                </button>
                {showAnimePicker && (
                  <AnimeTagPicker
                    onSelect={(anime) => {
                      if (!taggedAnime.find((a) => a.mal_id === anime.mal_id)) {
                        setTaggedAnime((prev) => [...prev, anime].slice(0, 3));
                      }
                    }}
                    onClose={() => setShowAnimePicker(false)}
                  />
                )}
              </div>

              {/* Visibility picker */}
              <div className="relative">
                <button
                  onClick={() => setShowVisibility(!showVisibility)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-white/30 hover:bg-white/5 transition-colors"
                >
                  <currentVisibility.icon size={14} />
                  {currentVisibility.label}
                </button>
                {showVisibility && (
                  <div className="absolute bottom-full left-0 mb-1 bg-[#0d0d1a] border border-white/10 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setVisibility(opt.value); setShowVisibility(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors",
                          visibility === opt.value ? "text-pink-400 font-medium" : "text-white/40"
                        )}
                      >
                        <opt.icon size={13} /> {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("text-xs", content.length > 480 ? "text-red-400" : "text-white/25")}>
                {content.length}/500
              </span>
              <button
                onClick={() => mutation.mutate()}
                disabled={!content.trim() || mutation.isPending || content.length > 500}
                className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-90 disabled:opacity-30 text-white text-sm font-medium rounded-lg transition-opacity"
              >
                {mutation.isPending ? "Đang đăng..." : "Đăng"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
