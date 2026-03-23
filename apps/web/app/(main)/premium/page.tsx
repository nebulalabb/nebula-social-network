"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Crown, Check, Zap, Star, Shield, Sparkles, Loader2, X } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

const PLANS = [
  {
    key: "MONTHLY",
    label: "Hàng tháng",
    price: "49.000₫",
    priceNote: "/tháng",
    badge: null,
    features: [
      "Không quảng cáo",
      "Badge Premium đặc biệt",
      "Tùy chỉnh phòng 3D không giới hạn",
      "Tải fanart chất lượng cao",
      "Ưu tiên hỗ trợ",
      "50 Coin/tháng",
    ],
  },
  {
    key: "YEARLY",
    label: "Hàng năm",
    price: "399.000₫",
    priceNote: "/năm",
    badge: "Tiết kiệm 32%",
    features: [
      "Tất cả tính năng Monthly",
      "Exclusive avatar frame",
      "Truy cập sớm tính năng mới",
      "700 Coin/năm (thay vì 600)",
      "Tên màu đặc biệt trong chat",
      "Huy hiệu Verified Creator",
    ],
  },
];

const PERKS = [
  { icon: Shield, title: "Không quảng cáo", desc: "Trải nghiệm mượt mà, không bị gián đoạn" },
  { icon: Crown, title: "Badge độc quyền", desc: "Hiển thị huy hiệu Premium trên hồ sơ" },
  { icon: Sparkles, title: "Tính năng sớm", desc: "Truy cập beta các tính năng mới nhất" },
  { icon: Zap, title: "Coin hàng tháng", desc: "Nhận Coin để mua vật phẩm trong cửa hàng" },
  { icon: Star, title: "Phòng 3D nâng cao", desc: "Mở khóa theme và vật phẩm trang trí độc quyền" },
];

export default function PremiumPage() {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY">("YEARLY");

  const { data: subscription } = useQuery({
    queryKey: ["premium-subscription"],
    queryFn: async () => {
      const { data } = await apiClient.get("/premium/subscription");
      return data.data;
    },
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: (plan: string) => apiClient.post("/premium/subscribe", { plan }),
    onSuccess: (res) => {
      const url = res.data?.data?.paymentUrl;
      if (url) window.location.href = url;
      else toast.success("Đăng ký thành công!");
    },
    onError: () => toast.error("Không thể xử lý thanh toán. Vui lòng thử lại."),
  });

  const isActive = subscription?.status === "ACTIVE";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 rounded-2xl p-6 text-white text-center">
        <Crown size={40} className="mx-auto mb-3" />
        <h1 className="text-2xl font-bold mb-1">Anime Social Premium</h1>
        <p className="text-white/80 text-sm">Nâng cấp trải nghiệm anime của bạn lên một tầm cao mới</p>
        {isActive && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
            <Check size={14} /> Đang hoạt động đến {new Date(subscription.endAt).toLocaleDateString("vi-VN")}
          </div>
        )}
      </div>

      {/* Perks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PERKS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <Icon size={20} className="text-yellow-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Plans */}
      {!isActive && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Chọn gói</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key as any)}
                className={cn(
                  "relative text-left p-4 rounded-xl border-2 transition-all",
                  selectedPlan === plan.key
                    ? "border-pink-600 bg-pink-50 dark:bg-pink-950/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-pink-300"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.label}</span>
                  {selectedPlan === plan.key && <Check size={16} className="text-pink-600" />}
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-xs text-slate-500 ml-1">{plan.priceNote}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Check size={12} className="text-green-500 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <button
            onClick={() => subscribeMutation.mutate(selectedPlan)}
            disabled={subscribeMutation.isPending}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-pink-600 hover:from-yellow-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {subscribeMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Crown size={18} />}
            Đăng ký {PLANS.find((p) => p.key === selectedPlan)?.label}
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">Thanh toán qua VNPay · Hủy bất cứ lúc nào</p>
        </div>
      )}
    </div>
  );
}
