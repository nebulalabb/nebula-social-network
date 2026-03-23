"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const RoomScene = dynamic(() => import("../../../../components/room/RoomScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-slate-950">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-2 border-pink-600/30 border-t-pink-600 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Đang tải phòng...</p>
      </div>
    </div>
  ),
});

interface PageProps {
  params: { id: string };
}

export default function RoomPage({ params }: PageProps) {
  const { id } = params;

  return (
    <div className="w-full h-full relative">
      <Link
        href="/feed"
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10 transition-colors"
      >
        <ArrowLeft size={14} />
        Quay lại
      </Link>
      <RoomScene roomId={id} />
    </div>
  );
}
