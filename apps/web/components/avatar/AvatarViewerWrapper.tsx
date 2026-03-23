"use client";

import dynamic from "next/dynamic";

const AvatarViewer = dynamic(() => import("./AvatarViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center" style={{ height: 480 }}>
      <div className="w-8 h-8 border-2 border-pink-600/30 border-t-pink-600 rounded-full animate-spin" />
    </div>
  ),
});

export default AvatarViewer;
