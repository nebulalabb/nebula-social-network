"use client";

import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, RotateCcw, Save, ChevronRight, Upload, Box } from "lucide-react";
import apiClient from "../../lib/api-client";
import AnimeCharacter from "../room/AnimeCharacter";
import AvatarViewer from "./AvatarViewer";
import {
  useAvatarCreatorStore,
  CreatorTab,
  Rarity,
  CreatorItem,
} from "../../store/use-avatar-creator-store";

// ── Item catalog ──────────────────────────────────────────────────────────────
const CATALOG: Record<CreatorTab, CreatorItem[]> = {
  hair: [
    { id: "h1", name: "Mái thẳng", rarity: "common", previewColor: "#7c3aed" },
    { id: "h2", name: "Twintails", rarity: "rare", previewColor: "#ec4899" },
    { id: "h3", name: "Ahoge dài", rarity: "rare", previewColor: "#f59e0b" },
    { id: "h4", name: "Bob ngắn", rarity: "common", previewColor: "#10b981" },
    { id: "h5", name: "Ponytail", rarity: "epic", previewColor: "#6366f1" },
    { id: "h6", name: "Messy", rarity: "common", previewColor: "#ef4444" },
    { id: "h7", name: "Hime cut", rarity: "legendary", previewColor: "#fbbf24" },
    { id: "h8", name: "Wavy long", rarity: "epic", previewColor: "#a78bfa" },
  ],
  face: [
    { id: "f1", name: "Mặt tròn", rarity: "common" },
    { id: "f2", name: "Mặt oval", rarity: "common" },
    { id: "f3", name: "Mắt to", rarity: "rare" },
    { id: "f4", name: "Mắt mèo", rarity: "epic" },
    { id: "f5", name: "Mắt sao", rarity: "legendary" },
    { id: "f6", name: "Blush đậm", rarity: "rare" },
  ],
  outfit: [
    { id: "o1", name: "Seifuku", rarity: "common", previewColor: "#6366f1" },
    { id: "o2", name: "Maid", rarity: "rare", previewColor: "#ffffff" },
    { id: "o3", name: "Kimono", rarity: "epic", previewColor: "#ec4899" },
    { id: "o4", name: "Idol", rarity: "legendary", previewColor: "#fbbf24" },
    { id: "o5", name: "Casual", rarity: "common", previewColor: "#10b981" },
    { id: "o6", name: "Gothic", rarity: "rare", previewColor: "#1e1b4b" },
    { id: "o7", name: "Magical Girl", rarity: "epic", previewColor: "#f9a8d4" },
    { id: "o8", name: "Ninja", rarity: "rare", previewColor: "#374151" },
  ],
  accessory: [
    { id: "a1", name: "Nơ hồng", rarity: "common" },
    { id: "a2", name: "Kẹp sao", rarity: "rare" },
    { id: "a3", name: "Vương miện", rarity: "legendary" },
    { id: "a4", name: "Tai mèo", rarity: "epic" },
    { id: "a5", name: "Kính tròn", rarity: "rare" },
    { id: "a6", name: "Headphone", rarity: "epic" },
  ],
  pose: [
    { id: "idle", name: "Đứng yên", rarity: "common" },
    { id: "wave", name: "Vẫy tay", rarity: "common" },
    { id: "dance", name: "Nhảy", rarity: "rare" },
    { id: "bow", name: "Cúi chào", rarity: "common" },
  ],
};

const TABS: { id: CreatorTab; label: string; emoji: string }[] = [
  { id: "hair", label: "Tóc", emoji: "💇" },
  { id: "face", label: "Mặt", emoji: "👁️" },
  { id: "outfit", label: "Trang phục", emoji: "👗" },
  { id: "accessory", label: "Phụ kiện", emoji: "✨" },
  { id: "pose", label: "Pose", emoji: "🎭" },
];

const RARITY_COLORS: Record<Rarity, string> = {
  common: "border-slate-400/40 bg-slate-800/40",
  rare: "border-blue-400/60 bg-blue-900/30",
  epic: "border-purple-400/60 bg-purple-900/30",
  legendary: "border-yellow-400/60 bg-yellow-900/30",
};

const RARITY_BADGE: Record<Rarity, string> = {
  common: "text-slate-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Thường",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
};

// ── Color swatch ──────────────────────────────────────────────────────────────
const HAIR_COLORS = ["#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#1e1b4b", "#ffffff", "#374151"];
const OUTFIT_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#1e1b4b", "#ffffff", "#0ea5e9"];
const EYE_COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#a78bfa", "#ec4899", "#1e1b4b", "#6366f1"];

function ColorPicker({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
              value === c ? "border-white scale-110 shadow-lg" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-full cursor-pointer border-2 border-dashed border-slate-500 bg-transparent"
          title="Màu tùy chỉnh"
        />
      </div>
    </div>
  );
}

// ── Item grid ─────────────────────────────────────────────────────────────────
function ItemGrid({
  items,
  selected,
  onSelect,
}: {
  items: CreatorItem[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`relative p-2 rounded-xl border-2 transition-all hover:scale-105 text-left ${
            selected === item.id
              ? "border-pink-500 bg-pink-900/30 shadow-lg shadow-pink-500/20"
              : RARITY_COLORS[item.rarity]
          }`}
        >
          {/* Thumbnail */}
          <div
            className="w-full aspect-square rounded-lg mb-1.5 flex items-center justify-center text-2xl"
            style={{
              background: item.previewColor
                ? `linear-gradient(135deg, ${item.previewColor}44, ${item.previewColor}22)`
                : "rgba(255,255,255,0.05)",
            }}
          >
            {item.previewColor ? (
              <div
                className="w-8 h-8 rounded-full shadow-inner"
                style={{ backgroundColor: item.previewColor }}
              />
            ) : (
              <span className="text-lg">✦</span>
            )}
          </div>
          <p className="text-[11px] text-white font-medium truncate">{item.name}</p>
          <p className={`text-[9px] font-semibold ${RARITY_BADGE[item.rarity]}`}>
            {RARITY_LABEL[item.rarity]}
          </p>
          {/* Selected indicator */}
          {selected === item.id && (
            <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-pink-500 shadow-sm" />
          )}
          {/* Legendary sparkle */}
          {item.rarity === "legendary" && (
            <div className="absolute top-1 left-1">
              <Sparkles size={10} className="text-yellow-400" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── 3D Preview ────────────────────────────────────────────────────────────────
function CharacterPreview({
  clothColor,
  hairColor,
  pose,
}: {
  clothColor: string;
  hairColor: string;
  pose: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.5], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      className="w-full h-full"
    >
      <color attach="background" args={["#0f0a1e"]} />
      <ambientLight intensity={0.5} color="#c4b5fd" />
      <directionalLight position={[-3, 5, 5]} intensity={1.2} color="#fff7ed" />
      <directionalLight position={[4, 3, -3]} intensity={0.6} color="#7dd3fc" />
      <directionalLight position={[-4, 2, 3]} intensity={0.3} color="#fda4af" />
      {/* Floor glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.15} />
      </mesh>
      <Suspense fallback={null}>
        <AnimeCharacter
          clothColor={clothColor}
          hairColor={hairColor}
          animation={pose as any}
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.75}
        autoRotate
        autoRotateSpeed={1.5}
      />
    </Canvas>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CharacterCreator() {
  const qc = useQueryClient();
  const {
    tab, setTab,
    selectedItems, selectItem,
    colors, setColor,
    pose, setPose,
    reset,
  } = useAvatarCreatorStore();

  const [vrmUrl, setVrmUrl] = useState<string | null>(null);
  const [uploadingVrm, setUploadingVrm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVrmUpload = async (file: File) => {
    if (!file.name.endsWith(".vrm")) { toast.error("Chỉ hỗ trợ file .vrm"); return; }
    setUploadingVrm(true);
    try {
      const fd = new FormData();
      fd.append("vrm", file);
      const res = await apiClient.post("/upload/vrm", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res.data?.data?.vrmUrl;
      if (url) { setVrmUrl(url); qc.invalidateQueries({ queryKey: ["my-avatar"] }); toast.success("Đã tải VRM!"); }
    } catch { toast.error("Tải VRM thất bại"); }
    finally { setUploadingVrm(false); }
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/avatars/me", data),
    onSuccess: () => {
      toast.success("Đã lưu nhân vật!");
      qc.invalidateQueries({ queryKey: ["my-avatar"] });
    },
    onError: () => toast.error("Lưu thất bại"),
  });

  const handleSave = () => {
    saveMutation.mutate({
      hairColor: colors.hair,
      clothColor: colors.outfit,
      eyeColor: colors.eyes,
      skinColor: colors.skin,
      pose,
      selectedItems,
    });
  };

  const items = CATALOG[tab];

  return (
    <div className="flex h-full bg-[#0a0618] text-white overflow-hidden">
      {/* ── Left: 3D Preview ── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-white/10">
        {/* VRM upload strip */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0f0a1e]">
          <Box size={13} className="text-violet-400" />
          <span className="text-xs text-slate-400 flex-1">VRM avatar</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingVrm}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs transition-colors disabled:opacity-50"
          >
            <Upload size={11} />
            {uploadingVrm ? "Đang tải..." : "Tải .vrm"}
          </button>
          {vrmUrl && (
            <button onClick={() => setVrmUrl(null)} className="text-xs text-slate-500 hover:text-white px-1">✕</button>
          )}
          <input ref={fileInputRef} type="file" accept=".vrm" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVrmUpload(f); }} />
        </div>

        <div className="flex-1 relative">
          {vrmUrl ? (
            <AvatarViewer url={vrmUrl} height={400} />
          ) : (
            <CharacterPreview clothColor={colors.outfit} hairColor={colors.hair} pose={pose} />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0618] to-transparent pointer-events-none" />
        </div>

        {/* Color pickers */}
        <div className="p-4 space-y-1 border-t border-white/10 bg-[#0f0a1e]">
          <ColorPicker
            label="Màu tóc"
            colors={HAIR_COLORS}
            value={colors.hair}
            onChange={(c) => setColor("hair", c)}
          />
          <ColorPicker
            label="Màu trang phục"
            colors={OUTFIT_COLORS}
            value={colors.outfit}
            onChange={(c) => setColor("outfit", c)}
          />
          <ColorPicker
            label="Màu mắt"
            colors={EYE_COLORS}
            value={colors.eyes}
            onChange={(c) => setColor("eyes", c)}
          />
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-2 border-t border-white/10">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu nhân vật"}
          </button>
        </div>
      </div>

      {/* ── Right: Item selector ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-[#0f0a1e]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all border-b-2 ${
                tab === t.id
                  ? "border-pink-500 text-pink-400 bg-pink-900/20"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              {TABS.find((t) => t.id === tab)?.label}
            </h3>
            <span className="text-xs text-slate-500">{items.length} mục</span>
          </div>

          {tab === "pose" ? (
            <div className="grid grid-cols-2 gap-3">
              {CATALOG.pose.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { selectItem("pose", p.id); setPose(p.id); }}
                  className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                    pose === p.id
                      ? "border-pink-500 bg-pink-900/30"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <div className="text-2xl mb-1">🎭</div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className={`text-[10px] ${RARITY_BADGE[p.rarity]}`}>{RARITY_LABEL[p.rarity]}</p>
                </button>
              ))}
            </div>
          ) : (
            <ItemGrid
              items={items}
              selected={selectedItems[tab]}
              onSelect={(id) => selectItem(tab, id)}
            />
          )}
        </div>

        {/* Selected item info */}
        {selectedItems[tab] && tab !== "pose" && (
          <div className="p-4 border-t border-white/10 bg-[#0f0a1e] flex items-center justify-between">
            {(() => {
              const item = items.find((i) => i.id === selectedItems[tab]);
              if (!item) return null;
              return (
                <>
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className={`text-xs ${RARITY_BADGE[item.rarity]}`}>{RARITY_LABEL[item.rarity]}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
