"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../store/use-auth-store";
import { useNotificationStore } from "../../store/use-notification-store";
import {
  Home, Compass, Tv, BookOpen, Bell, MessageSquare,
  Users, Star, Settings, LogOut, User, Trophy,
  Calendar, Newspaper, Image, PenLine, Bookmark, BarChart2, CalendarDays,
  Brain, Sparkles, Shield, Zap, DoorOpen, Wand2, Search, Shirt, Crown, Swords,
} from "lucide-react";
import { cn } from "../../lib/utils";
import apiClient from "../../lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const NAV_MAIN = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/search", icon: Search, label: "Tìm kiếm" },
    { href: "/explore", icon: Compass, label: "Khám phá" },
    { href: "/anime", icon: Tv, label: "Anime" },
    { href: "/manga", icon: BookOpen, label: "Manga" },
    { href: "/notifications", icon: Bell, label: "Thông báo", badge: unreadCount },
    { href: "/messages", icon: MessageSquare, label: "Tin nhắn" },
    { href: "/friends", icon: Users, label: "Bạn bè" },
    { href: "/leaderboard", icon: Trophy, label: "Bảng xếp hạng" },
    { href: "/clubs", icon: Star, label: "Clubs" },
    { href: "/events", icon: CalendarDays, label: "Sự kiện" },
    { href: "/room/my", icon: DoorOpen, label: "Phòng của tôi" },
    { href: "/avatar/creator", icon: Wand2, label: "Tạo nhân vật" },
  ];

  const NAV_CONTENT = [
    { href: "/schedule", icon: Calendar, label: "Lịch phát sóng" },
    { href: "/news", icon: Newspaper, label: "Tin tức" },
    { href: "/fanart", icon: Image, label: "Fanart" },
    { href: "/fanfic", icon: PenLine, label: "Fanfiction" },
    { href: "/cosplay", icon: Shirt, label: "Cosplay" },
    { href: "/bookmarks", icon: Bookmark, label: "Đã lưu" },
    { href: "/stats", icon: BarChart2, label: "Thống kê" },
    { href: "/personality", icon: Brain, label: "Cá tính Anime" },
    { href: "/wrapped", icon: Sparkles, label: "Anime Wrapped" },
    { href: "/premium", icon: Crown, label: "Premium" },
    { href: "/shop", icon: Swords, label: "Cửa hàng" },
  ];

  const dailyLoginMutation = useMutation({
    mutationFn: () => apiClient.post("/users/me/daily-login"),
    onSuccess: (res) => {
      const d = res.data?.data;
      if (d?.alreadyClaimed) toast.info("Bạn đã nhận EXP hôm nay rồi");
      else toast.success(`+${d?.expAwarded} EXP điểm danh hàng ngày!`);
    },
    onError: () => toast.error("Không thể nhận EXP"),
  });

  const handleLogout = async () => {
    await apiClient.post("/auth/logout").catch(() => {});
    logout();
    localStorage.removeItem("accessToken");
    document.cookie = "accessToken=; path=/; max-age=0";
    window.location.href = "/login";
  };

  const NavLink = ({ href, icon: Icon, label, badge }: { href: string; icon: any; label: string; badge?: number }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
        pathname.startsWith(href)
          ? "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <div className="relative">
        <Icon size={20} />
        {badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {label}
    </Link>
  );

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto">
      <Link href="/" className="flex items-center gap-3 px-3 py-2 mb-4">
        <div className="w-9 h-9 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-600/20">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-white">Anime Social</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV_MAIN.map(({ href, icon, label, badge }) => (
          <NavLink key={href} href={href} icon={icon} label={label} badge={badge} />
        ))}

        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nội dung</p>
        </div>
        {NAV_CONTENT.map(({ href, icon, label }) => (
          <NavLink key={href} href={href} icon={icon} label={label} />
        ))}
      </nav>

      {user && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 space-y-1">
          <NavLink href={`/profile/${user.username}`} icon={User} label="Trang cá nhân" />
          <NavLink href="/settings" icon={Settings} label="Cài đặt" />
          {user.role === "ADMIN" && (
            <NavLink href="/admin" icon={Shield} label="Admin" />
          )}
          <button
            onClick={() => dailyLoginMutation.mutate()}
            disabled={dailyLoginMutation.isPending}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-colors"
          >
            <Zap size={20} />
            Điểm danh (+3 EXP)
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      )}
    </aside>
  );
}
