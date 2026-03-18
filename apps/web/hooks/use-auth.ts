import { useMutation } from "@tanstack/react-query";
import apiClient from "../lib/api-client";
import { useAuthStore } from "../store/use-auth-store";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await apiClient.post("/auth/login", credentials);
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: any) => {
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
