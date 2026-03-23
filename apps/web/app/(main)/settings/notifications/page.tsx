"use client";

import { useState } from "react";
import { Bell, MessageSquare, Users, Star, Calendar, Tv, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface NotifSetting {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  inApp: boolean;
  push: boolean;
}

const DEFAULT_SETTINGS: NotifSetting[] = [
  { key: "like", label: "Lượt thích", description: "Khi ai đó thích bài đăng của bạn", icon: <Star className="w-4 h-4 text-yellow-400" />, inApp: true, push: false },
  { key: "comment", label: "Bình luận", description: "Khi ai đó bình luận bài đăng của bạn", icon: <MessageSquare className="w-4 h-4 text-blue-400" />, inApp: true, push: true },
  { key: "friend_request", label: "Lời mời kết bạn", description: "Khi ai đó gửi lời mời kết bạn", icon: <Users className="w-4 h-4 text-green-400" />, inApp: true, push: true },
  { key: "message", label: "Tin nhắn mới", description: "Khi bạn nhận được tin nhắn mới", icon: <MessageSquare className="w-4 h-4 text-purple-400" />, inApp: true, push: true },
  { key: "club", label: "Hoạt động Club", description: "Bài đăng mới trong club bạn tham gia", icon: <Star className="w-4 h-4 text-orange-400" />, inApp: true, push: false },
  { key: "event", label: "Sự kiện", description: "Nhắc nhở sự kiện sắp diễn ra", icon: <Calendar className="w-4 h-4 text-pink-400" />, inApp: true, push: true },
  { key: "anime_update", label: "Anime mới", description: "Tập mới của anime đang theo dõi", icon: <Tv className="w-4 h-4 text-cyan-400" />, inApp: true, push: false },
  { key: "manga_update", label: "Manga mới", description: "Chapter mới của manga đang đọc", icon: <BookOpen className="w-4 h-4 text-indigo-400" />, inApp: true, push: false },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-purple-600" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("08:00");
  const [dndEnabled, setDndEnabled] = useState(false);

  const update = (key: string, field: "inApp" | "push", val: boolean) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, [field]: val } : s));
  };

  const save = () => toast.success("Đã lưu cài đặt thông báo");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-purple-400" />
        <h1 className="text-xl font-bold text-white">Cài đặt thông báo</h1>
      </div>

      {/* DND */}
      <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-medium">Không làm phiền</p>
            <p className="text-gray-400 text-sm">Tắt thông báo trong khung giờ nhất định</p>
          </div>
          <Toggle checked={dndEnabled} onChange={setDndEnabled} />
        </div>
        {dndEnabled && (
          <div className="flex gap-4 mt-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Từ</label>
              <input type="time" value={dndStart} onChange={(e) => setDndStart(e.target.value)}
                className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm border border-white/10" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Đến</label>
              <input type="time" value={dndEnd} onChange={(e) => setDndEnd(e.target.value)}
                className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm border border-white/10" />
            </div>
          </div>
        )}
      </div>

      {/* Settings table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px] text-xs text-gray-500 px-4 py-2 border-b border-white/10">
          <span>Loại thông báo</span>
          <span className="text-center">Trong app</span>
          <span className="text-center">Push</span>
        </div>
        {settings.map((s) => (
          <div key={s.key} className="grid grid-cols-[1fr_80px_80px] items-center px-4 py-3 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-white text-sm">{s.label}</p>
                <p className="text-gray-500 text-xs">{s.description}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Toggle checked={s.inApp} onChange={(v) => update(s.key, "inApp", v)} />
            </div>
            <div className="flex justify-center">
              <Toggle checked={s.push} onChange={(v) => update(s.key, "push", v)} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium transition-colors">
        Lưu cài đặt
      </button>
    </div>
  );
}
