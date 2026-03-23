"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useRegister } from "../../../hooks/use-auth";
import apiClient from "../../../lib/api-client";

const registerSchema = z
  .object({
    username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [userId, setUserId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();
  const verifyMutation = useMutation({
    mutationFn: async (otp: string) => {
      const { data } = await apiClient.post("/auth/verify-email", { otp, userId });
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.match(/[A-Z]/)) score += 25;
    if (pwd.match(/[0-9]/)) score += 25;
    if (pwd.match(/[^A-Za-z0-9]/)) score += 25;
    return score;
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-slate-200 dark:bg-slate-800";
    if (score <= 25) return "bg-red-500";
    if (score <= 50) return "bg-orange-500";
    if (score <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const passwordStrength = calculateStrength(password);

  const onSubmit = async (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: (res: any) => {
        toast.success("Đăng ký thành công! Vui lòng xác minh email.");
        router.push(`/verify-email?userId=${res.user.id}&email=${res.user.email}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Đăng ký thất bại.");
      },
    });
  };

  const isSubmitting = registerMutation.isPending;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Tham gia cộng đồng!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tạo tài khoản để kết nối với các Otaku khác
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="username">
            Username
          </label>
          <input
            {...register("username")}
            id="username"
            placeholder="otaku_kun"
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.username && (
            <p className="text-xs text-red-500 font-medium">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="email">
            Email
          </label>
          <input
            {...register("email")}
            id="email"
            placeholder="name@example.com"
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="password">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 pr-10 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
          
          {/* Mật khẩu mạnh/yếu indicator */}
          <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
              style={{ width: `${passwordStrength}%` }}
            />
          </div>
          {password && <p className="text-[10px] text-right text-slate-500">{passwordStrength <= 25 ? "Yếu" : passwordStrength <= 50 ? "Trung bình" : passwordStrength <= 75 ? "Khá" : "Mạnh"}</p>}

          {errors.password && (
            <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 pr-10 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Đăng ký"
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
            Hoặc đăng ký với
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Google", provider: "google" },
          { label: "Discord", provider: "discord" },
        ].map(({ label, provider }) => (
          <button
            key={provider}
            type="button"
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/${provider}`}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-pink-600 hover:text-pink-500 font-semibold"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
