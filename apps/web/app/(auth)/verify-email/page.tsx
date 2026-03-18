"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../../lib/api-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      const { data } = await apiClient.post("/auth/verify-email", { otp: otpCode, userId });
      return data;
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/auth/resend-verification", { email });
      return data;
    },
  });

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  const handleComplete = (otpCode: string) => {
    verifyMutation.mutate(otpCode, {
      onSuccess: () => {
        toast.success("Xác minh thành công! Đang chuyển hướng...");
        router.push("/login");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Xác minh thất bại.");
      },
    });
  };

  const handleResend = () => {
    resendMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Mã mới đã được gửi!");
        setTimer(600);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Gửi lại thất bại.");
      },
    });
  };

  if (!userId) {
    return <div className="p-8 text-center text-red-500 font-medium">Yêu cầu không hợp lệ. Vui lòng đăng ký lại.</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Xác minh tài khoản</h2>
        <p className="text-sm text-slate-500">Chúng tôi đã gửi mã OTP 6 số đến email của bạn</p>
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

      <div className="text-sm font-medium">
        Thời gian còn lại: <span className="text-pink-600">{formatTime(timer)}</span>
      </div>

      <div className="pt-2">
        <button
          onClick={handleResend}
          disabled={timer > 540 || resendMutation.isPending}
          className="text-sm font-semibold text-pink-600 hover:text-pink-500 disabled:opacity-50"
        >
          {resendMutation.isPending ? "Đang xử lý..." : "Chưa nhận được mã? Gửi lại"}
        </button>
      </div>
    </div>
  );
}
