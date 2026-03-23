"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import apiClient from "../../../lib/api-client";
import { Loader2, Brain, Tv, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

// Radar chart using SVG
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const n = data.length;

  const points = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const valuePoints = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rv = (d.value / 100) * r;
    return { x: cx + rv * Math.cos(angle), y: cy + rv * Math.sin(angle) };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={points.map((p) => {
            const dx = (p.x - cx) * level;
            const dy = (p.y - cy) * level;
            return `${cx + dx},${cy + dy}`;
          }).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-slate-200 dark:text-slate-700"
        />
      ))}
      {/* Axes */}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-700" />
      ))}
      {/* Data polygon */}
      <polygon
        points={valuePoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="rgba(236,72,153,0.2)"
        stroke="rgb(236,72,153)"
        strokeWidth="2"
      />
      {/* Data dots */}
      {valuePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgb(236,72,153)" />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const lx = cx + (r + 18) * Math.cos((Math.PI * 2 * i) / n - Math.PI / 2);
        const ly = cy + (r + 18) * Math.sin((Math.PI * 2 * i) / n - Math.PI / 2);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" className="fill-slate-500 dark:fill-slate-400">
            {data[i].label}
          </text>
        );
      })}
    </svg>
  );
}

// Archetype quiz
const QUIZ_QUESTIONS = [
  {
    q: "Bạn thích loại nhân vật nào nhất?",
    options: [
      { label: "Anh hùng mạnh mẽ, không bao giờ bỏ cuộc", type: "SHONEN" },
      { label: "Nhân vật phức tạp, nhiều bí ẩn", type: "SEINEN" },
      { label: "Nhân vật dễ thương, đáng yêu", type: "MOEBLOB" },
      { label: "Nhân vật thông minh, chiến lược", type: "STRATEGIST" },
    ],
  },
  {
    q: "Bạn thích cốt truyện như thế nào?",
    options: [
      { label: "Hành động, chiến đấu kịch tính", type: "SHONEN" },
      { label: "Tâm lý, triết học sâu sắc", type: "SEINEN" },
      { label: "Slice of life, nhẹ nhàng", type: "MOEBLOB" },
      { label: "Bí ẩn, giải đố, twist bất ngờ", type: "STRATEGIST" },
    ],
  },
  {
    q: "Anime nào gần với sở thích của bạn nhất?",
    options: [
      { label: "Naruto / One Piece / Demon Slayer", type: "SHONEN" },
      { label: "Berserk / Vinland Saga / Monster", type: "SEINEN" },
      { label: "K-On! / Nichijou / Yuru Camp", type: "MOEBLOB" },
      { label: "Death Note / Code Geass / Steins;Gate", type: "STRATEGIST" },
    ],
  },
  {
    q: "Khi xem anime, bạn thường cảm thấy gì?",
    options: [
      { label: "Hứng khởi, muốn chiến đấu cùng nhân vật", type: "SHONEN" },
      { label: "Suy nghĩ sâu về ý nghĩa cuộc sống", type: "SEINEN" },
      { label: "Thư giãn, vui vẻ, muốn ôm nhân vật", type: "MOEBLOB" },
      { label: "Cố đoán trước diễn biến tiếp theo", type: "STRATEGIST" },
    ],
  },
];

const ARCHETYPES: Record<string, { title: string; desc: string; emoji: string; color: string }> = {
  SHONEN: { title: "Chiến Binh Shōnen", desc: "Bạn yêu thích sự hứng khởi, tình bạn và ý chí không bao giờ bỏ cuộc. Anime với bạn là nguồn cảm hứng để vượt qua giới hạn bản thân.", emoji: "⚡", color: "from-orange-500 to-red-600" },
  SEINEN: { title: "Triết Nhân Seinen", desc: "Bạn tìm kiếm chiều sâu trong từng tác phẩm. Anime với bạn là nghệ thuật — một phương tiện khám phá bản chất con người.", emoji: "🌑", color: "from-slate-700 to-slate-900" },
  MOEBLOB: { title: "Thiên Thần Moe", desc: "Bạn yêu sự dễ thương và những khoảnh khắc ấm áp. Anime với bạn là nơi trú ẩn bình yên sau một ngày dài.", emoji: "🌸", color: "from-pink-400 to-rose-500" },
  STRATEGIST: { title: "Đại Chiến Lược Gia", desc: "Bạn thích những bộ anime đòi hỏi tư duy. Mỗi twist là một thử thách trí tuệ mà bạn không thể bỏ qua.", emoji: "♟️", color: "from-purple-600 to-indigo-700" },
};

function ArchetypeQuiz({ onComplete }: { onComplete: (type: string) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (type: string) => {
    const next = [...answers, type];
    if (step + 1 >= QUIZ_QUESTIONS.length) {
      // Tally
      const counts: Record<string, number> = {};
      next.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      onComplete(winner);
    } else {
      setAnswers(next);
      setStep(step + 1);
    }
  };

  const q = QUIZ_QUESTIONS[step];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Câu {step + 1}/{QUIZ_QUESTIONS.length}</span>
        <div className="flex gap-1">
          {QUIZ_QUESTIONS.map((_, i) => (
            <div key={i} className={cn("w-6 h-1.5 rounded-full transition-colors", i <= step ? "bg-pink-500" : "bg-slate-200 dark:bg-slate-700")} />
          ))}
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">{q.q}</h3>
      <div className="space-y-2">
        {q.options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => handleAnswer(opt.type)}
            className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-300 dark:hover:border-pink-700 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-all"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PersonalityPage() {
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["personality"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/me/personality");
      return data.data;
    },
  });

  const archetype = quizResult ? ARCHETYPES[quizResult] : null;

  // Build radar data from genreCount
  const radarData = data?.genreCount
    ? Object.entries(data.genreCount as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, count]) => {
          const max = Math.max(...Object.values(data.genreCount as Record<string, number>));
          return { label: label.length > 8 ? label.slice(0, 7) + "…" : label, value: Math.round((count / max) * 100) };
        })
    : [];

  const handleShare = () => {
    const text = archetype
      ? `Tôi là "${archetype.title}" ${archetype.emoji} trên AnimeSocial! Khám phá cá tính anime của bạn tại animesocial.vn`
      : `Cá tính anime của tôi: ${data?.personality?.type} — ${data?.personality?.desc?.slice(0, 60)}...`;
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép để chia sẻ!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-purple-500" size={28} />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cá tính Anime</h1>
        </div>
        <button
          onClick={() => setShowQuiz(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Brain size={15} /> Làm quiz
        </button>
      </div>

      {/* Quiz result */}
      {quizResult && archetype && (
        <div className={cn("bg-gradient-to-br rounded-3xl p-8 text-white text-center shadow-xl", archetype.color)}>
          <p className="text-5xl mb-3">{archetype.emoji}</p>
          <h2 className="text-3xl font-black mb-2">{archetype.title}</h2>
          <p className="text-white/80 text-sm leading-relaxed">{archetype.desc}</p>
          <div className="flex gap-2 justify-center mt-4">
            <button onClick={() => { setQuizResult(null); setShowQuiz(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
              <RefreshCw size={14} /> Làm lại
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
              <Share2 size={14} /> Chia sẻ
            </button>
          </div>
        </div>
      )}

      {/* Quiz modal */}
      {showQuiz && !quizResult && (
        <ArchetypeQuiz onComplete={(type) => { setQuizResult(type); setShowQuiz(false); }} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-600" size={32} /></div>
      ) : data ? (
        <div className="space-y-4">
          {/* API personality card */}
          {!quizResult && (
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white text-center shadow-xl">
              <p className="text-purple-200 text-sm mb-2">Dựa trên {data.totalCompleted} anime đã xem</p>
              <h2 className="text-4xl font-black mb-2">{data.personality?.type}</h2>
              <p className="text-purple-100">{data.personality?.desc}</p>
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                  <Share2 size={14} /> Chia sẻ
                </button>
              </div>
            </div>
          )}

          {/* Radar chart */}
          {radarData.length >= 3 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">Biểu đồ thể loại</h3>
              <RadarChart data={radarData} />
            </div>
          )}

          {/* Top genres */}
          {data.topGenres?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Thể loại yêu thích</h3>
              <div className="flex flex-wrap gap-2">
                {data.topGenres.map((g: string, i: number) => (
                  <span key={g} className={cn("px-4 py-2 rounded-full text-sm font-medium", i === 0 ? "bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
                    {i === 0 && "⭐ "}{g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Genre breakdown bars */}
          {data.genreCount && Object.keys(data.genreCount).length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Phân tích chi tiết</h3>
              <div className="space-y-2">
                {Object.entries(data.genreCount as Record<string, number>)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([genre, count]) => {
                    const max = Math.max(...Object.values(data.genreCount as Record<string, number>));
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={genre} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-28 shrink-0">{genre}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {data.totalCompleted === 0 && (
            <div className="text-center py-10 text-slate-500">
              <Tv className="mx-auto mb-3 text-slate-300" size={48} />
              <p>Hãy xem thêm anime để khám phá cá tính của bạn</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
