"use client";

import { useState, Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { X, Shirt, Palette, Sparkles, Check, Upload, Box } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AnimeCharacter from "./AnimeCharacter";
import AvatarViewer from "../avatar/AvatarViewer";
import apiClient from "../../lib/api-client";
import type { AnimationState } from "./AnimeCharacter";

// ── Sample VRMs ───────────────────────────────────────────────────────────────
const SAMPLE_VRMS = [
  { id: "sample_a", name: "Avatar A", url: "/models/AvatarSample_A.vrm", emoji: "🧑" },
  { id: "sample_c", name: "Avatar C", url: "/models/AvatarSample_C.vrm", emoji: "👩" },
];

// ── Outfit presets ────────────────────────────────────────────────────────────
export interface OutfitPreset {
  id: string;
  name: string;
  emoji: string;
  clothColor: string;
  hairColor: string;
  desc: string;
}

export const OUTFIT_PRESETS: OutfitPreset[] = [
  { id: "school",   name: "Đồng phục",    emoji: "🎒", clothColor: "#3b82f6", hairColor: "#1e1b4b", desc: "Học sinh anime" },
  { id: "maid",     name: "Maid",         emoji: "🎀", clothColor: "#1e1b4b", hairColor: "#7c3aed", desc: "Maid café" },
  { id: "magical",  name: "Phép thuật",   emoji: "✨", clothColor: "#8b5cf6", hairColor: "#ec4899", desc: "Magical girl" },
  { id: "casual",   name: "Thường ngày",  emoji: "👕", clothColor: "#6366f1", hairColor: "#92400e", desc: "Casual style" },
  { id: "idol",     name: "Idol",         emoji: "🌟", clothColor: "#ec4899", hairColor: "#fbbf24", desc: "Idol stage" },
  { id: "ninja",    name: "Ninja",        emoji: "🥷", clothColor: "#1e293b", hairColor: "#0f172a", desc: "Shinobi style" },
  { id: "princess", name: "Công chúa",   emoji: "👑", clothColor: "#f9a8d4", hairColor: "#fde68a", desc: "Royal princess" },
  { id: "cyber",    name: "Cyber",        emoji: "🤖", clothColor: "#06b6d4", hairColor: "#a78bfa", desc: "Cyberpunk" },
];

// ── Hair color options ────────────────────────────────────────────────────────
const HAIR_COLORS = [
  { name: "Đen",    value: "#1e1b4b" },
  { name: "Nâu",    value: "#92400e" },
  { name: "Vàng",   value: "#fbbf24" },
  { name: "Hồng",   value: "#ec4899" },
  { name: "Tím",    value: "#7c3aed" },
  { name: "Xanh",   value: "#3b82f6" },
  { name: "Đỏ",     value: "#dc2626" },
  { name: "Trắng",  value: "#f1f5f9" },
  { name: "Xanh lá",value: "#10b981" },
  { name: "Cam",    value: "#f97316" },
];

// ── Cloth color options ───────────────────────────────────────────────────────
const CLOTH_COLORS = [
  { name: "Tím",    value: "#6366f1" },
  { name: "Hồng",   value: "#ec4899" },
  { name: "Xanh",   value: "#3b82f6" },
  { name: "Đen",    value: "#1e1b4b" },
  { name: "Trắng",  value: "#f1f5f9" },
  { name: "Đỏ",     value: "#dc2626" },
  { name: "Xanh lá",value: "#10b981" },
  { name: "Vàng",   value: "#fbbf24" },
  { name: "Cam",    value: "#f97316" },
  { name: "Cyan",   value: "#06b6d4" },
];

// ── Preview poses ─────────────────────────────────────────────────────────────
const PREVIEW_POSES: { key: AnimationState; label: string; emoji: string }[] = [
  { key: "idle",  label: "Đứng",  emoji: "🧍" },
  { key: "wave",  label: "Vẫy",   emoji: "👋" },
  { key: "dance", label: "Nhảy",  emoji: "💃" },
  { key: "bow",   label: "Chào",  emoji: "🙇" },
];

// ── 3D Preview canvas ─────────────────────────────────────────────────────────
function AvatarPreview3D({
  clothColor,
  hairColor,
  pose,
}: {
  clothColor: string;
  hairColor: string;
  pose: AnimationState;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.5], fov: 45 }}
      gl={{ antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <pointLight position={[-2, 3, 2]} color="#fce7f3" intensity={0.6} />
      <Suspense fallback={null}>
        <AnimeCharacter
          clothColor={clothColor}
          hairColor={hairColor}
          animation={pose}
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={1.5}
      />
    </Canvas>
  );
}

// ── Color swatch ──────────────────────────────────────────────────────────────
function ColorSwatch({
  color,
  name,
  selected,
  onClick,
}: {
  color: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={name}
      className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
        selected ? "border-white scale-110 shadow-lg" : "border-transparent"
      }`}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <Check
          size={12}
          className="absolute inset-0 m-auto text-white drop-shadow"
          strokeWidth={3}
        />
      )}
    </button>
  );
}

// ── Main DressingRoom ─────────────────────────────────────────────────────────
interface DressingRoomProps {
  initialClothColor?: string;
  initialHairColor?: string;
  onApply: (clothColor: string, hairColor: string, outfitId: string) => void;
  onClose: () => void;
}

export default function DressingRoom({
  initialClothColor = "#6366f1",
  initialHairColor = "#7c3aed",
  onApply,
  onClose,
}: DressingRoomProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clothColor, setClothColor] = useState(initialClothColor);
  const [hairColor, setHairColor] = useState(initialHairColor);
  const [selectedOutfit, setSelectedOutfit] = useState<string>("casual");
  const [pose, setPose] = useState<AnimationState>("idle");
  const [tab, setTab] = useState<"outfit" | "hair" | "cloth" | "vrm">("outfit");
  const [vrmPreviewUrl, setVrmPreviewUrl] = useState<string | null>(null);
  const [uploadingVrm, setUploadingVrm] = useState(false);

  const handleSelectOutfit = (preset: OutfitPreset) => {
    setSelectedOutfit(preset.id);
    setClothColor(preset.clothColor);
    setHairColor(preset.hairColor);
  };

  const handleVrmUpload = async (file: File) => {
    if (!file.name.endsWith(".vrm")) {
      toast.error("Chỉ hỗ trợ file .vrm");
      return;
    }
    setUploadingVrm(true);
    try {
      const formData = new FormData();
      formData.append("vrm", file);
      const res = await apiClient.post("/upload/vrm", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.vrmUrl;
      if (url) {
        setVrmPreviewUrl(url);
        qc.invalidateQueries({ queryKey: ["my-avatar"] });
        toast.success("Đã tải VRM lên thành công!");
      }
    } catch {
      toast.error("Tải VRM thất bại");
    } finally {
      setUploadingVrm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-pink-400" />
            <h2 className="text-white font-bold text-lg">Phòng thay đồ</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex h-[520px]">
          {/* ── Left: 3D preview ── */}
          <div className="w-64 flex flex-col border-r border-white/10">
            <div className="flex-1 relative overflow-hidden">
              {tab === "vrm" && vrmPreviewUrl ? (
                <AvatarViewer url={vrmPreviewUrl} height={320} />
              ) : (
                <AvatarPreview3D clothColor={clothColor} hairColor={hairColor} pose={pose} />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
            </div>
            {/* Pose selector — hide on VRM tab */}
            {tab !== "vrm" && (
              <div className="flex items-center justify-center gap-1 px-3 py-3 border-t border-white/10">
                {PREVIEW_POSES.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    onClick={() => setPose(key)}
                    title={label}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xs transition-all ${
                      pose === key
                        ? "bg-pink-600/40 text-pink-300 border border-pink-500/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-[9px]">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: customization ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { key: "outfit", label: "Trang phục", icon: <Shirt size={14} /> },
                { key: "hair",   label: "Màu tóc",    icon: <Palette size={14} /> },
                { key: "cloth",  label: "Màu áo",     icon: <Palette size={14} /> },
                { key: "vrm",    label: "VRM 3D",     icon: <Box size={14} /> },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as any)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
                    tab === key
                      ? "border-pink-500 text-pink-300"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Outfit presets */}
              {tab === "outfit" && (
                <div className="grid grid-cols-2 gap-3">
                  {OUTFIT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectOutfit(preset)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                        selectedOutfit === preset.id
                          ? "border-pink-500 bg-pink-600/20 shadow-lg shadow-pink-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <div className="absolute inset-0" style={{ backgroundColor: preset.clothColor }} />
                        <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ backgroundColor: preset.hairColor }} />
                        <span className="absolute inset-0 flex items-center justify-center text-xl">{preset.emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{preset.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{preset.desc}</p>
                      </div>
                      {selectedOutfit === preset.id && <Check size={14} className="text-pink-400 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Hair colors */}
              {tab === "hair" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Chọn màu tóc</p>
                  <div className="flex flex-wrap gap-3">
                    {HAIR_COLORS.map(({ name, value }) => (
                      <div key={value} className="flex flex-col items-center gap-1">
                        <ColorSwatch color={value} name={name} selected={hairColor === value} onClick={() => setHairColor(value)} />
                        <span className="text-[9px] text-slate-400">{name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <label className="text-xs text-slate-400">Màu tùy chỉnh:</label>
                    <input type="color" value={hairColor} onChange={(e) => setHairColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/20 cursor-pointer bg-transparent" />
                    <span className="text-xs text-slate-300 font-mono">{hairColor}</span>
                  </div>
                </div>
              )}

              {/* Cloth colors */}
              {tab === "cloth" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Chọn màu trang phục</p>
                  <div className="flex flex-wrap gap-3">
                    {CLOTH_COLORS.map(({ name, value }) => (
                      <div key={value} className="flex flex-col items-center gap-1">
                        <ColorSwatch color={value} name={name} selected={clothColor === value} onClick={() => setClothColor(value)} />
                        <span className="text-[9px] text-slate-400">{name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <label className="text-xs text-slate-400">Màu tùy chỉnh:</label>
                    <input type="color" value={clothColor} onChange={(e) => setClothColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/20 cursor-pointer bg-transparent" />
                    <span className="text-xs text-slate-300 font-mono">{clothColor}</span>
                  </div>
                </div>
              )}

              {/* VRM tab */}
              {tab === "vrm" && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-400">Tải lên nhân vật VRoid (.vrm) của bạn</p>

                  {/* Upload button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500/50 hover:bg-pink-600/5 cursor-pointer transition-all"
                  >
                    <Upload size={24} className="text-pink-400" />
                    <p className="text-sm text-white font-medium">
                      {uploadingVrm ? "Đang tải lên..." : "Chọn file .vrm"}
                    </p>
                    <p className="text-[10px] text-slate-500">Tối đa 50MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vrm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVrmUpload(file);
                    }}
                  />

                  {/* Sample VRMs */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Hoặc dùng mẫu có sẵn</p>
                    <div className="grid grid-cols-2 gap-3">
                      {SAMPLE_VRMS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setVrmPreviewUrl(s.url)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            vrmPreviewUrl === s.url
                              ? "border-pink-500 bg-pink-600/20"
                              : "border-white/10 bg-white/5 hover:border-white/30"
                          }`}
                        >
                          <span className="text-2xl">{s.emoji}</span>
                          <div className="text-left">
                            <p className="text-sm text-white font-medium">{s.name}</p>
                            <p className="text-[10px] text-slate-400">VRoid sample</p>
                          </div>
                          {vrmPreviewUrl === s.url && <Check size={14} className="text-pink-400 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {vrmPreviewUrl && (
                    <p className="text-[10px] text-green-400 text-center">
                      ✓ VRM đã được tải — xem preview bên trái
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Apply button */}
            <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-5 h-5 rounded-full border-2 border-white/30" style={{ backgroundColor: clothColor }} />
                <div className="w-5 h-5 rounded-full border-2 border-white/30" style={{ backgroundColor: hairColor }} />
                <span className="text-xs text-slate-400">
                  {tab === "vrm" && vrmPreviewUrl ? "VRM avatar" : OUTFIT_PRESETS.find((o) => o.id === selectedOutfit)?.name ?? "Tùy chỉnh"}
                </span>
              </div>
              <button
                onClick={() => onApply(clothColor, hairColor, selectedOutfit)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-pink-500/20"
              >
                <Sparkles size={14} />
                Mặc vào
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
