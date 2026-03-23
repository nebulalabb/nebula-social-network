"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal,
  ThumbsUp, Laugh, Frown, Angry, Eye, EyeOff,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { cn } from "../../lib/utils";
import { CommentSection } from "./comment-section";

interface Post {
  _id: string;
  userId: string;
  content: string;
  media: { type: "IMAGE" | "VIDEO"; url: string; thumbnailUrl?: string }[];
  hashtags: string[];
  hasSpoiler: boolean;
  isSpoilerHidden?: boolean;
  visibility: string;
  engagement: { reactionCount: number; commentCount: number; repostCount: number };
  author?: { username: string; displayName?: string; avatarUrl?: string };
  userReaction?: string;
  isBookmarked?: boolean;
  createdAt: string;
}

const REACTIONS = [
  { type: "LIKE", icon: ThumbsUp, label: "Thích", color: "text-blue-500" },
  { type: "LOVE", icon: Heart, label: "Yêu thích", color: "text-red-500" },
  { type: "LOL", icon: Laugh, label: "Haha", color: "text-yellow-500" },
  { type: "SAD", icon: Frown, label: "Buồn", color: "text-blue-400" },
  { type: "ANGRY", icon: Angry, label: "Tức giận", color: "text-orange-500" },
];

export function PostCard({ post }: { post: Post }) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  // Server-side spoiler protection (based on user's watch progress)
  const isProtectedSpoiler = post.isSpoilerHidden && !showSpoiler;

  const reactMutation = useMutation({
    mutationFn: async (type: string) => {
      if (post.userReaction === type) {
        await apiClient.delete(`/posts/${post._id}/react`);
      } else {
        await apiClient.post(`/posts/${post._id}/react`, { type });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (post.isBookmarked) {
        await apiClient.delete(`/posts/${post._id}/bookmark`);
      } else {
        await apiClient.post(`/posts/${post._id}/bookmark`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const activeReaction = REACTIONS.find((r) => r.type === post.userReaction);

  return (
    <article className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <Link href={`/profile/${post.author?.username}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center shrink-0 overflow-hidden">
            {post.author?.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {(post.author?.displayName || post.author?.username || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-white/90 leading-tight">
              {post.author?.displayName || post.author?.username}
            </p>
            <p className="text-xs text-white/40">
              @{post.author?.username} ·{" "}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </Link>
        <button className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {(post.hasSpoiler && !showSpoiler) || isProtectedSpoiler ? (
          <div
            className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer select-none ${
              isProtectedSpoiler
                ? "bg-red-950/20 border border-red-800/40"
                : "bg-white/5 border border-white/10"
            }`}
            onClick={() => setShowSpoiler(true)}
          >
            <EyeOff size={18} className={isProtectedSpoiler ? "text-red-400 shrink-0" : "text-white/40 shrink-0"} />
            <div>
              <p className={`text-sm font-medium ${isProtectedSpoiler ? "text-red-400" : "text-white/60"}`}>
                {isProtectedSpoiler ? "Spoiler bị ẩn (dựa trên tiến độ xem của bạn)" : "Nội dung có spoiler"}
              </p>
              <p className="text-xs text-white/30">Nhấn để xem</p>
            </div>
          </div>
        ) : (
          <>
            {post.hasSpoiler && (
              <button
                onClick={() => setShowSpoiler(false)}
                className="flex items-center gap-1.5 text-xs text-white/40 mb-2 hover:text-white/60"
              >
                <Eye size={13} /> Ẩn spoiler
              </button>
            )}
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {post.hashtags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${tag}`}
                    className="text-xs text-pink-400 hover:text-pink-300 hover:underline"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media */}
      {post.media?.length > 0 && (
        <div
          className={cn(
            "grid gap-1 mx-4 mb-3 rounded-xl overflow-hidden",
            post.media.length === 1 && "grid-cols-1",
            post.media.length === 2 && "grid-cols-2",
            post.media.length >= 3 && "grid-cols-2"
          )}
        >
          {post.media.slice(0, 4).map((m, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-white/5 overflow-hidden",
                post.media.length === 1 ? "aspect-video" : "aspect-square",
                post.media.length === 3 && i === 0 && "row-span-2"
              )}
            >
              {m.type === "IMAGE" ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" controls />
              )}
              {i === 3 && post.media.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+{post.media.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between">
        {/* Reactions */}
        <div className="relative">
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeReaction
                ? `${activeReaction.color} bg-white/5`
                : "text-white/40 hover:text-pink-400 hover:bg-pink-500/10"
            )}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => reactMutation.mutate(activeReaction ? activeReaction.type : "LIKE")}
          >
            {activeReaction ? (
              <activeReaction.icon size={16} />
            ) : (
              <ThumbsUp size={16} />
            )}
            <span>{post.engagement.reactionCount || 0}</span>
          </button>

          {showReactions && (
            <div
              className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-[#0d0d1a] border border-white/10 rounded-full px-2 py-1.5 shadow-lg z-10"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  title={r.label}
                  onClick={() => { reactMutation.mutate(r.type); setShowReactions(false); }}
                  className={cn(
                    "p-1.5 rounded-full hover:scale-125 transition-transform",
                    r.color
                  )}
                >
                  <r.icon size={18} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
          <MessageCircle size={16} />
          <span>{post.engagement.commentCount || 0}</span>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/40 hover:text-green-400 hover:bg-green-500/10 transition-colors">
          <Repeat2 size={16} />
          <span>{post.engagement.repostCount || 0}</span>
        </button>

        <button
          onClick={() => bookmarkMutation.mutate()}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            post.isBookmarked
              ? "text-yellow-400 bg-yellow-500/10"
              : "text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10"
          )}
        >
          <Bookmark size={16} fill={post.isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>
      {showComments && <CommentSection postId={post._id} />}
    </article>
  );
}
