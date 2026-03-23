"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsUp, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import apiClient from "../../lib/api-client";
import { useAuthStore } from "../../store/use-auth-store";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface ReviewSectionProps {
  entityType: "ANIME" | "MANGA";
  entityId: string;
}

const SCORE_LABELS: Record<string, string> = {
  story: "Cốt truyện",
  art: "Hình ảnh",
  character: "Nhân vật",
  sound: "Âm thanh",
  enjoyment: "Trải nghiệm",
};

export function ReviewSection({ entityType, entityId }: ReviewSectionProps) {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", entityType, entityId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/reviews/${entityType}/${entityId}`);
      return data.data;
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: (reviewId: string) => apiClient.post(`/reviews/${reviewId}/helpful`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", entityType, entityId] }),
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      {data && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={20} fill="currentColor" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.avgScore || "N/A"}</span>
            </div>
            <span className="text-sm text-slate-500">/ 10 · {data.total} review</span>
          </div>
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {showForm ? "Hủy" : "Viết review"}
            </button>
          )}
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <WriteReviewForm
          entityType={entityType}
          entityId={entityId}
          onSuccess={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["reviews", entityType, entityId] });
          }}
        />
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={20} /></div>
      ) : data?.reviews?.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có review nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.reviews?.map((review: any) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={() => helpfulMutation.mutate(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onHelpful }: { review: any; onHelpful: () => void }) {
  const [showSpoiler, setShowSpoiler] = useState(false);

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
          {review.user?.profile?.avatarUrl ? (
            <img src={review.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-sm font-bold">{(review.user?.username || "?")[0].toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
              {review.user?.profile?.displayName || review.user?.username}
            </p>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{review.scoreTotal}/10</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi })}
          </p>
        </div>
      </div>

      {/* Score detail */}
      {review.scoreDetail && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {Object.entries(review.scoreDetail).map(([key, val]: any) => (
            <div key={key} className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
              <p className="text-xs text-slate-500">{SCORE_LABELS[key] || key}</p>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {review.hasSpoiler && !showSpoiler ? (
        <div
          className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2 cursor-pointer"
          onClick={() => setShowSpoiler(true)}
        >
          <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Review có spoiler</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Nhấn để xem</p>
          </div>
        </div>
      ) : (
        <div>
          {review.hasSpoiler && (
            <button
              onClick={() => setShowSpoiler(false)}
              className="flex items-center gap-1 text-xs text-slate-400 mb-2 hover:text-slate-600"
            >
              <EyeOff size={12} /> Ẩn spoiler
            </button>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{review.content}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onHelpful}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ThumbsUp size={13} /> Hữu ích ({review.isHelpful || 0})
        </button>
      </div>
    </div>
  );
}

function WriteReviewForm({ entityType, entityId, onSuccess }: { entityType: string; entityId: string; onSuccess: () => void }) {
  const [scoreTotal, setScoreTotal] = useState(7);
  const [scoreDetail, setScoreDetail] = useState({ story: 7, art: 7, character: 7, sound: 7, enjoyment: 7 });
  const [content, setContent] = useState("");
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Vui lòng nhập nội dung review");
    setLoading(true);
    try {
      await apiClient.post("/reviews", { entityType, entityId, scoreTotal, scoreDetail, content, hasSpoiler });
      toast.success("Đã đăng review");
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi đăng review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-pink-200 dark:border-pink-800 rounded-xl p-4 space-y-4 bg-pink-50/50 dark:bg-pink-950/10">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Viết review của bạn</h3>

      {/* Overall score */}
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
          Điểm tổng: <span className="text-pink-600 font-bold">{scoreTotal}/10</span>
        </label>
        <input
          type="range" min={1} max={10} value={scoreTotal}
          onChange={(e) => setScoreTotal(Number(e.target.value))}
          className="w-full accent-pink-600"
        />
      </div>

      {/* Detail scores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(scoreDetail).map(([key, val]) => (
          <div key={key}>
            <label className="text-xs text-slate-500 block mb-1">{SCORE_LABELS[key]}</label>
            <input
              type="number" min={1} max={10} value={val}
              onChange={(e) => setScoreDetail({ ...scoreDetail, [key]: Number(e.target.value) })}
              className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nội dung review *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn..."
          rows={5}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          required
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={hasSpoiler} onChange={(e) => setHasSpoiler(e.target.checked)} className="rounded" />
        <span className="text-sm text-slate-700 dark:text-slate-300">Review có chứa spoiler</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? "Đang đăng..." : "Đăng review"}
      </button>
    </form>
  );
}
