"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft, Wand2, Upload, Sparkles, User, Box,
  Check, RotateCcw, Save, ChevronRight, Palette,
} from "lucide-react";
import apiClient from "../../../../lib/api-client";

// Dynamic imports — Three.js client-only
const CharacterCreator = dynamic(
  () => import("../../../../components/avatar/CharacterCreator"),
  { ssr: false, loading: () => <ThreeLoader label="Đang tải Character Creator..." /> }
);
const VRMProfileViewerWrapper = dynamic(
  () => import("../../../../components/avatar/VRMProfileViewerWrapper"),
  { ssr: false, loading: () => <ThreeLoader label="Đang tải VRM viewer..." /> }
);

function ThreeLoader({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[#0a0618]">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-pink-600/20 flex items-center justify-center mx-auto animate-pulse">
          <Wand2 size={26} className="text-pink-400" />
        </div>
        <p className="text-slate-400 text-sm">{label}</p>
      </div>
    </div>
  );
}

// ── Sample VRMs ───────────────────────────────────────────────────────────────
const SAMPLE_VRMS = [
  {
    id: "vrm1",
    name: "Nhân vật 1",
    url: "/models/647887956803937611.vrm",
    emoji: "🧑",
    desc: "VRoid avatar nữ",
  },
  {
    id: "vrm2",
    name: "Nhân vật 2",
    url: "/models/8441268952432472996.vrm",
    emoji: "👩",
    desc: "VRoid avatar nữ 2",
  },
  {
    id: "alicia",
    name: "Alicia",
    url: "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Alicia_Solid.vrm",
    emoji: "✨",
    desc: "VRM Consortium official",
  },
];

type Tab = "stylized" | "vrm";

export default function AvatarCreatorPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("stylized");
  const [vrmUrl, setVrmUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: myAvatar } = useQuery({
    queryKey: ["my-avatar"],
    queryFn: () => apiClient.get("/avatars/me").then((r) => r.data?.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/avatars/me", data),
    onSuccess: () => {
      toast.success("Đã lưu avatar!");
      qc.invalidateQueries({ queryKey: ["my-avatar"] });
    },
    onError: () => toast.error("Lưu thất bại"),
  });

  const handleVrmUpload = async (file: File) => {
    if (!file.name.endsWith(".vrm")) { toast.error("Chỉ hỗ trợ file .vrm"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("vrm", file);
      const res = await apiClient.post("/avatars/me/upload-vrm", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.vrmUrl;
      if (url) {
        setVrmUrl(url);
        qc.invalidateQueries({ queryKey: ["my-avatar"] });
        toast.success("Tải VRM thành công!");
      }
    } catch { toast.error("Tải VRM thất bại"); }
    finally { setUploading(false); }
  };

  const activeVrm = vrmUrl ?? myAvatar?.vrmUrl ?? null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0618] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-[#0f0a1e] shrink-0">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={15} />
          Quay lại
        </Link>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2">
          <Wand2 size={15} className="text-pink-400" />
          <span className="text-white font-semibold text-sm">Tạo nhân vật</span>
        </div>

        {/* Tab switcher */}
        <div className="ml-6 flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setTab("stylized")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === "stylized"
                ? "bg-pink-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Palette size={12} />
            Nhân vật Anime
          </button>
          <button
            onClick={() => setTab("vrm")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === "vrm"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Box size={12} />
            VRM Avatar
          </button>
        </div>

        <div className="ml-auto text-xs text-slate-600">Anime 3D Social</div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        {tab === "stylized" ? (
          <CharacterCreator />
        ) : (
          <VRMTab
            activeVrm={activeVrm}
            vrmUrl={vrmUrl}
            setVrmUrl={setVrmUrl}
            uploading={uploading}
            fileRef={fileRef}
            onUpload={handleVrmUpload}
            onSave={(url) => saveMutation.mutate({ vrmUrl: url })}
            saving={saveMutation.isPending}
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".vrm"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVrmUpload(f); }}
      />
    </div>
  );
}

// ── VRM Tab ───────────────────────────────────────────────────────────────────
function VRMTab({
  activeVrm,
  vrmUrl,
  setVrmUrl,
  uploading,
  fileRef,
  onUpload,
  onSave,
  saving,
}: {
  activeVrm: string | null;
  vrmUrl: string | null;
  setVrmUrl: (url: string) => void;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onUpload: (f: File) => void;
  onSave: (url: string) => void;
  saving: boolean;
}) {
  return (
    <div className="flex h-full">
      {/* Left: 3D viewer */}
      <div className="flex-1 relative bg-slate-950">
        {activeVrm ? (
          <div className="h-full">
            <VRMProfileViewerWrapper url={activeVrm} showControls={false} height={600} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-4">
            <div className="w-20 h-20 rounded-full bg-violet-600/20 flex items-center justify-center">
              <User size={36} className="text-violet-400" />
            </div>
            <p className="text-slate-400 text-sm">Chưa có VRM avatar</p>
            <p className="text-slate-600 text-xs">Tải lên hoặc chọn mẫu bên phải</p>
          </div>
        )}

        {/* Hint overlay */}
        {activeVrm && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/30 pointer-events-none bg-black/30 px-3 py-1 rounded-full">
            Kéo để xoay · Di chuột để nhân vật nhìn theo
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="w-80 shrink-0 flex flex-col border-l border-white/10 bg-[#0f0a1e] overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Upload section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload size={14} className="text-violet-400" />
              <span className="text-sm font-semibold">Tải lên VRM</span>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 hover:bg-violet-600/5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload size={22} className="text-violet-400" />
              <span className="text-sm text-white font-medium">
                {uploading ? "Đang tải lên..." : "Chọn file .vrm"}
              </span>
              <span className="text-[10px] text-slate-500">Tối đa 50MB · Tạo tại VRoid Studio</span>
            </button>
          </div>

          {/* Sample VRMs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-pink-400" />
              <span className="text-sm font-semibold">Avatar mẫu</span>
            </div>
            <div className="space-y-2">
              {SAMPLE_VRMS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setVrmUrl(s.url)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    activeVrm === s.url
                      ? "border-violet-500 bg-violet-600/20"
                      : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8"
                  }`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </div>
                  {activeVrm === s.url && <Check size={14} className="text-violet-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          {activeVrm && (
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => onSave(activeVrm)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg shadow-violet-500/20"
              >
                <Save size={15} />
                {saving ? "Đang lưu..." : "Lưu làm avatar chính"}
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Avatar sẽ hiển thị trong phòng và profile của bạn
              </p>
            </div>
          )}

          {/* VRoid Studio link */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 mb-1 font-medium">Tạo avatar riêng?</p>
            <p className="text-[10px] text-slate-500 mb-2">
              Dùng VRoid Studio (miễn phí) để tạo nhân vật anime 3D của riêng bạn.
            </p>
            <a
              href="https://vroid.com/en/studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Tải VRoid Studio <ChevronRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
