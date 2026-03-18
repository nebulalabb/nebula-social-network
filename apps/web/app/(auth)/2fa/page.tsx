"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";

export default function TwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setAuth = useAuthStore((state) => state.setAuth);

  const validate2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post("/auth/2fa/validate", { userId, token });
      return data.data;
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto submit
    if (newOtp.every(digit => digit !== "") && index === 5) {
      handleComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleComplete = (token: string) => {
    validate2FAMutation.mutate(token, {
      onSuccess: (data) => {
        setAuth(data.user, data.accessToken);
        toast.success("Xác thực 2FA thành công!");
        router.push(callbackUrl);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Mã 2FA không chính xác.");
      },
    });
  };

  if (!userId) {
    return <div className="p-8 text-center text-red-500 font-medium">Yêu cầu không hợp lệ. Vui lòng đăng nhập lại.</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Xác thực 2 yếu tố</h2>
        <p className="text-sm text-slate-500">Nhập mã 6 số từ ứng dụng Google Authenticator</p>
      </div>

      <div className="flex justify-center gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-10 h-10 text-center text-lg font-bold border-2 rounded-md focus:border-pink-600 focus:ring-0 outline-none dark:bg-slate-800 dark:border-slate-700"
          />
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-slate-500 hover:text-pink-600"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}
