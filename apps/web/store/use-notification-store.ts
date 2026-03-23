import { create } from "zustand";

interface Notification {
  id: string;
  type: string;
  actorId?: string;
  actor?: { username: string; displayName?: string; avatarUrl?: string };
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  setNotifications: (ns: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
    })),
  setNotifications: (ns) => set({ notifications: ns }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));
