"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";
import { useForgotPassword } from "../../../hooks/use-auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const forgotMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
        toast.success("Yêu cầu khôi phục mật khẩu đã được gửi!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Gửi yêu cầu thất bại.");
      },
    });
  };

  if (isSuccess) {
    return (
      <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h2 className="text-xl font-semibold">Email đã được gửi!</h2>
        <p className="text-sm text-slate-500">Vui lòng kiểm tra hộp thư của bạn để lấy link đặt lại mật khẩu.</p>
        <Link href="/login" className="block text-pink-600 font-medium hover:underline">Quay lại đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">Quên mật khẩu?</h2>
        <p className="text-sm text-slate-500">Nhập email của bạn và chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
          <input
            {...register("email")}
            id="email"
            placeholder="name@example.com"
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-pink-600 outline-none"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={forgotMutation.isPending}
          className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {forgotMutation.isPending ? "Đang gửi..." : "Gửi link khôi phục"}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-slate-500 hover:text-pink-600 transition-colors">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
