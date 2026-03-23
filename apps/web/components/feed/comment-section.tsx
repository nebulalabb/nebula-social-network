"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Send, Loader2, CornerDownRight, Trash2 } from "lucide-react";
import Link from "next/link";
import apiClient from "../../lib/api-client";
import { useAuthStore } from "../../store/use-auth-store";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/posts/${postId}/comments`);
      return data.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/posts/${postId}/comments`, {
        content: input,
        parentId: replyTo?.id,
      });
      return data.data;
    },
    onSuccess: () => {
      setInput("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const comments = data?.comments || [];

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3">
      {/* Input */}
      {user && (
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {user.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (user.username?.[0] || "A").toUpperCase()
            )}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              {replyTo && (
                <div className="flex items-center gap-1 text-xs text-pink-600 mb-1">
                  <CornerDownRight size={11} />
                  <span>Trả lời @{replyTo.username}</span>
                  <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 ml-1">×</button>
                </div>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && input.trim()) { e.preventDefault(); addMutation.mutate(); } }}
                placeholder={replyTo ? `Trả lời @${replyTo.username}...` : "Viết bình luận..."}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              onClick={() => addMutation.mutate()}
              disabled={!input.trim() || addMutation.isPending}
              className="p-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
            >
              {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 size={16} className="animate-spin text-pink-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment: any) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUserId={user?.id}
              onReply={(id, username) => setReplyTo({ id, username })}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, currentUserId, onReply, postId }: any) {
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/posts/${postId}/comments/${comment._id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
  });

  return (
    <div className="flex gap-2 group">
      <Link href={`/profile/${comment.author?.username}`} className="shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center">
          {comment.author?.avatarUrl ? (
            <img src={comment.author.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-bold">
              {(comment.author?.displayName || comment.author?.username || "?")[0].toUpperCase()}
            </span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
          <Link href={`/profile/${comment.author?.username}`} className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-pink-600">
            {comment.author?.displayName || comment.author?.username}
          </Link>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
          </span>
          <button
            onClick={() => onReply(comment._id, comment.author?.username)}
            className="text-xs text-slate-500 hover:text-pink-600 transition-colors"
          >
            Trả lời
          </button>
          {comment.userId === currentUserId && (
            <button
              onClick={() => deleteMutation.mutate()}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
