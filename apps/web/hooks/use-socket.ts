import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/use-auth-store";
import { useNotificationStore } from "../store/use-notification-store";
import { toast } from "sonner";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || initialized.current) return;
    initialized.current = true;

    socketInstance = io(SOCKET_URL, {
      auth: { token: accessToken },
      withCredentials: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("[socket] connected");
    });

    socketInstance.on("notification:new", (notification: any) => {
      addNotification(notification);
      toast(getNotificationText(notification), { duration: 4000 });
    });

    socketInstance.on("disconnect", () => {
      console.log("[socket] disconnected");
    });

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
      initialized.current = false;
    };
  }, [isAuthenticated, accessToken]);

  return socketInstance;
};

export const getSocket = () => socketInstance;

function getNotificationText(n: any): string {
  const actor = n.actor?.displayName || n.actor?.username || "Ai đó";
  switch (n.type) {
    case "LIKE": return `${actor} đã thích bài đăng của bạn`;
    case "COMMENT": return `${actor} đã bình luận bài đăng của bạn`;
    case "FOLLOW": return `${actor} đã theo dõi bạn`;
    case "FRIEND_REQUEST": return `${actor} đã gửi lời mời kết bạn`;
    case "FRIEND_ACCEPT": return `${actor} đã chấp nhận lời mời kết bạn`;
    case "MENTION": return `${actor} đã nhắc đến bạn`;
    default: return "Bạn có thông báo mới";
  }
}
