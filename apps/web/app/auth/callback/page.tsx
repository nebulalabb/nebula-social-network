"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/use-auth-store";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuth(user, token);
        localStorage.setItem("accessToken", token);
        toast.success("Đăng nhập bằng mạng xã hội thành công!");
        router.push("/");
      } catch (error) {
        toast.error("Lỗi xử lý dữ liệu đăng nhập.");
        router.push("/login");
      }
    } else {
      toast.error("Không tìm thấy thông tin đăng nhập.");
      router.push("/login");
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500">Đang xử lý đăng nhập...</p>
    </div>
  );
}
