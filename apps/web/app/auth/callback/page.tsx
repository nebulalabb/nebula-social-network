"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../../store/use-auth-store";
import apiClient from "../../../lib/api-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { router.replace("/login"); return; }

    localStorage.setItem("accessToken", token);
    document.cookie = `accessToken=${token}; path=/; max-age=${14 * 60}`;

    // Fetch user info
    apiClient.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      setAuth(data.data.user, token);
      router.replace("/");
    }).catch(() => {
      router.replace("/login");
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin" />
    </div>
  );
}
