import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: !!user }),
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          document.cookie = "accessToken=; path=/; max-age=0";
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
