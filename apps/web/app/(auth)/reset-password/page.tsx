"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPassword } from "../../../hooks/use-auth";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      toast.error("Thiếu token xác thực. Vui lòng kiểm tra lại email của bạn.");
      return;
    }

    resetMutation.mutate({ token, newPassword: data.password }, {
      onSuccess: () => {
        toast.success("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
        router.push("/login");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Đặt lại mật khẩu thất bại.");
      },
    });
  };

  if (!token) {
    return (
      <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-red-500 font-medium">Link không hợp lệ hoặc đã hết hạn.</p>
        <button onClick={() => router.push("/forgot-password")} className="mt-4 text-pink-600 hover:underline">Yêu cầu link mới</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">Đặt lại mật khẩu</h2>
        <p className="text-sm text-slate-500">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="password">Mật khẩu mới</label>
          <input
            {...register("password")}
            id="password"
            type="password"
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-pink-600 outline-none"
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <input
            {...register("confirmPassword")}
            id="confirmPassword"
            type="password"
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-pink-600 outline-none"
          />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={resetMutation.isPending}
          className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {resetMutation.isPending ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </div>
  );
}
