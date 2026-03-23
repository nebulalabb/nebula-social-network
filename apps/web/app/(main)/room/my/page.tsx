"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Home, Loader2 } from "lucide-react";
import apiClient from "../../../../lib/api-client";

export default function MyRoomPage() {
  const router = useRouter();

  const { data: room, isLoading, isError } = useQuery({
    queryKey: ["my-room"],
    queryFn: () => apiClient.get("/rooms/my").then((r) => r.data?.data),
    retry: 1,
  });

  useEffect(() => {
    if (room?.id) {
      router.replace(`/room/${room.id}`);
    }
  }, [room, router]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <Home size={24} className="text-red-400" />
          </div>
          <p className="text-white font-medium">Không thể tải phòng</p>
          <p className="text-slate-400 text-sm">Vui lòng thử lại sau</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full bg-pink-600/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-600/30 to-purple-600/30 flex items-center justify-center">
            {isLoading ? (
              <Loader2 size={26} className="text-pink-400 animate-spin" />
            ) : (
              <Home size={26} className="text-pink-400" />
            )}
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          {isLoading ? "Đang tải phòng của bạn..." : "Đang vào phòng..."}
        </p>
      </div>
    </div>
  );
}
