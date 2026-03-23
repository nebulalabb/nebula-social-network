"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useAuthStore } from "../../store/use-auth-store";
import apiClient from "../../lib/api-client";
import { useSocket } from "../../hooks/use-socket";
import { useNotificationStore } from "../../store/use-notification-store";

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  isAuthenticated: false, 
  isLoading: true 
});

export const useAuth = () => useContext(AuthContext);

function SocketInitializer() {
  useSocket();
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, setAuth, logout, isAuthenticated } = useAuthStore();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAccessToken = async () => {
    try {
      const { data } = await apiClient.post("/auth/refresh");
      if (data?.data?.accessToken) {
        setAuth(user!, data.data.accessToken);
        document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=${14 * 60}`;
      }
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (!user || !accessToken) return;
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${14 * 60}`;
    intervalRef.current = setInterval(refreshAccessToken, 14 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  // Fetch unread notification count on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get("/notifications/unread-count")
      .then(({ data }) => setUnreadCount(data.data?.count || 0))
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading: false }}>
      {isAuthenticated && <SocketInitializer />}
      {children}
    </AuthContext.Provider>
  );
}
