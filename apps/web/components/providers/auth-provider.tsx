"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useAuthStore } from "../../store/use-auth-store";
import apiClient from "../../lib/api-client";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, setAuth, logout } = useAuthStore();
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

    // Đặt cookie để middleware có thể đọc
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${14 * 60}`;

    // Auto-refresh token mỗi 14 phút
    intervalRef.current = setInterval(refreshAccessToken, 14 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading: false 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
