"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Tv, Bell, MessageSquare, User } from "lucide-react";
import { useAuthStore } from "../../store/use-auth-store";
import { useNotificationStore } from "../../store/use-notification-store";
import { cn } from "../../lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const NAV = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/explore", icon: Compass, label: "Khám phá" },
    { href: "/anime", icon: Tv, label: "Anime" },
    { href: "/notifications", icon: Bell, label: "Thông báo", badge: unreadCount },
    { href: "/messages", icon: MessageSquare, label: "Tin nhắn" },
    ...(user ? [{ href: `/profile/${user.username}`, icon: User, label: "Tôi" }] : []),
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px]",
                isActive
                  ? "text-pink-600"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {badge && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
