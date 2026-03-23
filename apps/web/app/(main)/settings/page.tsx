"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/use-auth-store";
import { User, Lock, Bell, Shield, Palette, Loader2, Save, EyeOff, Ban, Camera, Sparkles, Wand2 } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Link from "next/link";
import dynamic from "next/dynamic";

const AvatarSettings = dynamic(() => import("../../../components/avatar/AvatarSettings"), { ssr: false });

const TABS = ["Hồ sơ", "Avatar 3D", "Tạo nhân vật", "Bảo mật", "Thông báo", "Quyền riêng tư", "Giao diện", "Spoiler", "Đã chặn"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS = {
  "Hồ sơ": User, "Avatar 3D": Sparkles, "Tạo nhân vật": Wand2, "Bảo mật": Lock, "Thông báo": Bell,
  "Quyền riêng tư": Shield, "Giao diện": Palette, "Spoiler": EyeOff, "Đã chặn": Ban,
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Hồ sơ");

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h1 className="font-bold text-slate-900 dark:text-white">Cài đặt</h1>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 p-2">
            {TABS.map((t) => {
              const Icon = TAB_ICONS[t];
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    tab === t ? "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}>
                  <Icon size={16} /> {t}
                </button>
              );
            })}
          </div>
          <div className="flex-1 p-4">
            {tab === "Hồ sơ" && <ProfileSettings />}
            {tab === "Avatar 3D" && <AvatarSettings />}
            {tab === "Tạo nhân vật" && <CreatorRedirect />}
            {tab === "Bảo mật" && <SecuritySettings />}
            {tab === "Thông báo" && <NotificationSettings />}
            {tab === "Quyền riêng tư" && <PrivacySettings />}
            {tab === "Giao diện" && <AppearanceSettings />}
            {tab === "Spoiler" && <SpoilerSettings />}
            {tab === "Đã chặn" && <BlockedUsersSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorRedirect() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-5">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
        <Wand2 size={36} className="text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Tạo nhân vật 3D</h2>
        <p className="text-sm text-slate-500 max-w-xs">Tùy chỉnh nhân vật anime của bạn với hệ thống creator đầy đủ — tóc, mặt, trang phục, phụ kiện và pose.</p>
      </div>
      <Link
        href="/avatar/creator"
        className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-pink-600/30"
      >
        <Wand2 size={18} /> Mở Character Creator
      </Link>
    </div>
  );
}

function AvatarUpload({ currentUrl, onUploaded }: { currentUrl?: string; onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await apiClient.post("/upload/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data.data.url);
      toast.success("Đã tải ảnh lên");
    } catch {
      toast.error("Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-20 h-20 group cursor-pointer" onClick={() => inputRef.current?.click()}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={24} className="text-white/70" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? <Loader2 size={18} className="text-white animate-spin" /> : <Camera size={18} className="text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({ displayName: "", bio: "", location: "", website: "", avatarUrl: "", bannerUrl: "" });

  const { isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/me");
      const p = data.data?.user?.profile;
      if (p) setForm({
        displayName: p.displayName || "",
        bio: p.bio || "",
        location: p.location || "",
        website: p.website || "",
        avatarUrl: p.avatarUrl || "",
        bannerUrl: p.bannerUrl || "",
      });
      return p;
    },
  });

  const mutation = useMutation({
    mutationFn: () => apiClient.put("/users/me/profile", form),
    onSuccess: () => { toast.success("Đã cập nhật hồ sơ"); qc.invalidateQueries({ queryKey: ["my-profile"] }); },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={24} /></div>;

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-semibold text-slate-800 dark:text-slate-200">Thông tin hồ sơ</h2>

      <div className="flex items-center gap-4">
        <AvatarUpload
          currentUrl={form.avatarUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
        />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ảnh đại diện</p>
          <p className="text-xs text-slate-500 mt-0.5">Nhấn để thay đổi (tối đa 10MB)</p>
        </div>
      </div>

      {[
        { key: "displayName", label: "Tên hiển thị", placeholder: user?.username },
        { key: "bio", label: "Giới thiệu", placeholder: "Viết gì đó về bản thân...", multiline: true },
        { key: "location", label: "Địa điểm", placeholder: "Hà Nội, Việt Nam" },
        { key: "website", label: "Website", placeholder: "https://..." },
        { key: "bannerUrl", label: "URL ảnh bìa", placeholder: "https://..." },
      ].map(({ key, label, placeholder, multiline }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
          {multiline ? (
            <textarea
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          ) : (
            <input
              type="text"
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          )}
        </div>
      ))}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Lưu thay đổi
      </button>
    </div>
  );
}

function SecuritySettings() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const mutation = useMutation({
    mutationFn: () => apiClient.put("/auth/change-password", form),
    onSuccess: () => { toast.success("Đã đổi mật khẩu"); setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); },
    onError: () => toast.error("Đổi mật khẩu thất bại"),
  });

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-semibold text-slate-800 dark:text-slate-200">Đổi mật khẩu</h2>
      {[
        { key: "currentPassword", label: "Mật khẩu hiện tại" },
        { key: "newPassword", label: "Mật khẩu mới" },
        { key: "confirmPassword", label: "Xác nhận mật khẩu mới" },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
          <input
            type="password"
            value={(form as any)[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      ))}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword}
        className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Đổi mật khẩu
      </button>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    likes: true, comments: true, friendRequests: true, follows: true,
    mentions: true, animeUpdates: true, mangaUpdates: false,
  });

  const items = [
    { key: "likes", label: "Lượt thích bài đăng" },
    { key: "comments", label: "Bình luận bài đăng" },
    { key: "friendRequests", label: "Lời mời kết bạn" },
    { key: "follows", label: "Người theo dõi mới" },
    { key: "mentions", label: "Được nhắc đến (@mention)" },
    { key: "animeUpdates", label: "Anime mới cập nhật" },
    { key: "mangaUpdates", label: "Manga mới cập nhật" },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-semibold text-slate-800 dark:text-slate-200">Cài đặt thông báo</h2>
      <div className="space-y-3">
        {items.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
            <button
              onClick={() => setSettings((s) => ({ ...s, [key]: !(s as any)[key] }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${(settings as any)[key] ? "bg-pink-600" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(settings as any)[key] ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacySettings() {
  const [settings, setSettings] = useState({ profileVisibility: "PUBLIC", showAnimeList: true, showMangaList: true, showAge: false });
  const mutation = useMutation({
    mutationFn: () => apiClient.put("/users/me/profile", { visibility: settings.profileVisibility, showAnimeList: settings.showAnimeList, showMangaList: settings.showMangaList, showAge: settings.showAge }),
    onSuccess: () => toast.success("Đã lưu cài đặt"),
  });

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-semibold text-slate-800 dark:text-slate-200">Quyền riêng tư</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Hiển thị hồ sơ</label>
        <select
          value={settings.profileVisibility}
          onChange={(e) => setSettings((s) => ({ ...s, profileVisibility: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="PUBLIC">Công khai</option>
          <option value="FRIENDS">Chỉ bạn bè</option>
          <option value="PRIVATE">Riêng tư</option>
        </select>
      </div>
      {[
        { key: "showAnimeList", label: "Hiển thị Anime List" },
        { key: "showMangaList", label: "Hiển thị Manga List" },
        { key: "showAge", label: "Hiển thị tuổi" },
      ].map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
          <button
            onClick={() => setSettings((s) => ({ ...s, [key]: !(s as any)[key] }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${(settings as any)[key] ? "bg-pink-600" : "bg-slate-300 dark:bg-slate-600"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(settings as any)[key] ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      ))}
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
        {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu
      </button>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-semibold text-slate-800 dark:text-slate-200">Giao diện</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Chế độ màu</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Sáng", bg: "bg-white border-slate-200" },
            { value: "dark", label: "Tối", bg: "bg-slate-900 border-slate-700" },
            { value: "system", label: "Hệ thống", bg: "bg-gradient-to-br from-white to-slate-900 border-slate-300" },
          ].map(({ value, label, bg }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`p-4 rounded-xl border-2 transition-all ${bg} ${theme === value ? "border-pink-600 ring-2 ring-pink-600/20" : "border-transparent"}`}
            >
              <p className={`text-sm font-medium ${value === "dark" ? "text-white" : "text-slate-800"}`}>{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpoilerSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["spoiler-settings"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/me/spoiler-settings");
      return data.data as Array<{ animeId: string; progress: number }>;
    },
  });

  const qc = useQueryClient();
  const [animeId, setAnimeId] = useState("");
  const [progress, setProgress] = useState(0);

  const addMutation = useMutation({
    mutationFn: () => apiClient.put(`/users/me/spoiler-settings/${animeId}`, { progress }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spoiler-settings"] });
      setAnimeId(""); setProgress(0);
      toast.success("Đã lưu cài đặt spoiler");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Bảo vệ Spoiler</h2>
        <p className="text-sm text-slate-500">Ẩn nội dung spoiler cho các anime bạn đang xem dở</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="MAL ID anime (vd: 1)"
          value={animeId}
          onChange={(e) => setAnimeId(e.target.value)}
          className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        />
        <input
          type="number"
          placeholder="Tập đã xem"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-28 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!animeId || addMutation.isPending}
          className="px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
        >
          Thêm
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
      ) : settings?.length ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Anime đang theo dõi</h3>
          {settings.map((s) => (
            <div key={s.animeId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-700 dark:text-slate-300">Anime ID: {s.animeId}</span>
              <span className="text-sm text-slate-500">Tập {s.progress}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-6">Chưa có cài đặt spoiler nào</p>
      )}
    </div>
  );
}

function BlockedUsersSettings() {
  const qc = useQueryClient();

  const { data: blocked, isLoading } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/me/blocked");
      return data.data as Array<{ id: string; username: string; profile?: { displayName?: string; avatarUrl?: string } }>;
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/users/block/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
      toast.success("Đã bỏ chặn người dùng");
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Người dùng đã chặn</h2>
        <p className="text-sm text-slate-500">Những người này không thể xem hồ sơ hoặc liên hệ với bạn</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
      ) : !blocked?.length ? (
        <div className="text-center py-12">
          <Ban size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500">Bạn chưa chặn ai</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blocked.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
                {u.profile?.avatarUrl ? (
                  <img src={u.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {(u.profile?.displayName || u.username)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${u.username}`} className="font-medium text-sm text-slate-800 dark:text-slate-200 hover:text-pink-600 truncate block">
                  {u.profile?.displayName || u.username}
                </Link>
                <p className="text-xs text-slate-500">@{u.username}</p>
              </div>
              <button
                onClick={() => unblockMutation.mutate(u.id)}
                disabled={unblockMutation.isPending}
                className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg hover:border-pink-300 hover:text-pink-600 transition-colors disabled:opacity-50"
              >
                Bỏ chặn
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
