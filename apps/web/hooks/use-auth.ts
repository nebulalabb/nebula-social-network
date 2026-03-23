import { useMutation } from "@tanstack/react-query";
import apiClient from "../lib/api-client";
import { useAuthStore } from "../store/use-auth-store";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: any) => {
      // Response: { status, accessToken, user } hoặc { status, data: { twoFactorRequired, userId } }
      const { data } = await apiClient.post("/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      // Chỉ lưu auth nếu không cần 2FA
      if (!data.data?.twoFactorRequired && data.accessToken && data.user) {
        setAuth(data.user, data.accessToken);
        localStorage.setItem("accessToken", data.accessToken);
        // Set cookie để middleware đọc được
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${14 * 60}; SameSite=Strict`;
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: any) => {
      // Response: { status, message, data: { user } }
      const { data } = await apiClient.post("/auth/register", userData);
      return data.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await apiClient.post("/auth/forgot-password", data);
      return res;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await apiClient.post("/auth/reset-password", data);
      return res;
    },
  });
};
