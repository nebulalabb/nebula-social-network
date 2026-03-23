"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useLogin } from "../../../hooks/use-auth";
import apiClient from "../../../lib/api-client";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (res: any) => {
        // res = { status, accessToken, user } hoặc { status, data: { twoFactorRequired, userId } }
        if (res.data?.twoFactorRequired) {
          toast.info("Vui lòng thực hiện bước xác thực 2FA.");
          router.push(`/2fa?userId=${res.data.userId}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else {
          toast.success("Đăng nhập thành công!");
          // Dùng full reload để middleware đọc được cookie mới
          window.location.href = callbackUrl;
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Đăng nhập thất bại.");
      },
    });
  };

  const isSubmitting = loginMutation.isPending;

  if (false) { // Path removed, keeping structure for easy diff
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Mừng bạn quay lại!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vui lòng nhập thông tin để đăng nhập
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          {errors.password && (
            <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-pink-600 focus:ring-pink-600" />
            <span className="text-slate-600 dark:text-slate-400">Ghi nhớ đăng nhập</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-pink-600 hover:text-pink-500 font-medium"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Google", provider: "google" },
          { label: "Discord", provider: "discord" },
          { label: "Facebook", provider: "facebook" },
        ].map(({ label, provider }) => (
          <button
            key={provider}
            type="button"
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/${provider}`}
            className="flex h-10 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="text-pink-600 hover:text-pink-500 font-semibold"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
