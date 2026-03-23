"use client";

import dynamic from "next/dynamic";

const VRMProfileViewer = dynamic(() => import("./VRMProfileViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center"
      style={{ height: 400 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-pink-600/30 border-t-pink-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Đang tải avatar 3D...</p>
      </div>
    </div>
  ),
});

export default function VRMProfileViewerWrapper(props: React.ComponentProps<typeof VRMProfileViewer>) {
  return <VRMProfileViewer {...props} />;
}
