"use client";

import { useState } from "react";
import { Camera, Edit3, Users, X, Shirt, Keyboard, ChevronDown, ChevronUp, ImageIcon, Palette, Wand2, Map } from "lucide-react";
import EmoteBar from "./EmoteBar";
import VoiceBar from "./VoiceBar";
import Minimap from "./Minimap";
import { RemotePlayer } from "../../hooks/useRoomSocket";

interface RoomHUDProps {
  roomId: string;
  roomName: string;
  players: Map<string, RemotePlayer>;
  isOwner: boolean;
  onEmote: (emote: string) => void;
  onToggleEdit: () => void;
  isEditing: boolean;
  onToggleCamera: () => void;
  cameraMode: "third" | "first";
  onOpenDressing?: () => void;
  onOpenPhotoMode?: () => void;
  onOpenThemes?: () => void;
  onOpenCharacterCreator?: () => void;
  voiceActive: boolean;
  voiceMuted: boolean;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onVoiceMuteToggle: () => void;
  playerPos?: { x: number; z: number };
  playerRy?: number;
}

const CONTROLS = [
  { key: "WASD / ↑↓←→", desc: "Di chuyển" },
  { key: "Shift", desc: "Chạy nhanh" },
  { key: "Space", desc: "Nhảy" },
  { key: "V", desc: "Đổi góc nhìn" },
  { key: "Click", desc: "Khóa chuột" },
  { key: "ESC", desc: "Mở khóa chuột" },
  { key: "1-9", desc: "Emote nhanh" },
];

export default function RoomHUD({
  roomId,
  roomName,
  players,
  isOwner,
  onEmote,
  onToggleEdit,
  isEditing,
  onToggleCamera,
  cameraMode,
  onOpenDressing,
  onOpenPhotoMode,
  onOpenThemes,
  onOpenCharacterCreator,
  playerPos = { x: 0, z: 0 },
  playerRy = 0,
  voiceActive,
  voiceMuted,
  onVoiceStart,
  onVoiceStop,
  onVoiceMuteToggle,
}: RoomHUDProps) {
  const [showPlayers, setShowPlayers] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  const playerList = Array.from(players.values());
  const totalPlayers = playerList.length + 1;

  return (
    <>
      {/* ── Top bar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/10 shadow-xl">
        {/* Room name */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          <span className="text-white text-sm font-bold tracking-wide">{roomName}</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        {/* Player count */}
        <button
          onClick={() => setShowPlayers(!showPlayers)}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
        >
          <Users size={13} />
          <span className="text-xs font-medium">{totalPlayers}</span>
        </button>
      </div>

      {/* ── Right side buttons ── */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Camera toggle */}
        <button
          onClick={onToggleCamera}
          title={cameraMode === "third" ? "Góc nhìn thứ nhất [V]" : "Góc nhìn thứ ba [V]"}
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all hover:scale-105"
        >
          <Camera size={17} />
        </button>

        {/* Dressing room */}
        <button
          onClick={onOpenDressing}
          title="Thay trang phục"
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 text-pink-300 hover:bg-pink-600/30 hover:border-pink-500/50 transition-all hover:scale-105"
        >
          <Shirt size={17} />
        </button>

        {/* Edit room (owner only) */}
        {isOwner && (
          <button
            onClick={onToggleEdit}
            title="Trang trí phòng"
            className={`w-10 h-10 flex items-center justify-center backdrop-blur-sm rounded-xl border transition-all hover:scale-105 ${
              isEditing
                ? "bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/30"
                : "bg-black/60 border-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Edit3 size={17} />
          </button>
        )}

        {/* Photo mode */}
        <button
          onClick={onOpenPhotoMode}
          title="Chế độ ảnh"
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 text-yellow-300 hover:bg-yellow-600/30 hover:border-yellow-500/50 transition-all hover:scale-105"
        >
          <ImageIcon size={17} />
        </button>

        {/* Theme presets */}
        <button
          onClick={onOpenThemes}
          title="Theme phòng"
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 text-emerald-300 hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all hover:scale-105"
        >
          <Palette size={17} />
        </button>

        {/* Character creator */}
        <button
          onClick={onOpenCharacterCreator}
          title="Tạo nhân vật"
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 text-violet-300 hover:bg-violet-600/30 hover:border-violet-500/50 transition-all hover:scale-105"
        >
          <Wand2 size={17} />
        </button>

        {/* Minimap toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          title="Bản đồ"
          className={`w-10 h-10 flex items-center justify-center backdrop-blur-sm rounded-xl border transition-all hover:scale-105 ${
            showMinimap
              ? "bg-cyan-600/40 border-cyan-500/50 text-cyan-300"
              : "bg-black/60 border-white/10 text-slate-300 hover:bg-white/20"
          }`}
        >
          <Map size={17} />
        </button>

        {/* Controls help */}
        <button
          onClick={() => setShowControls(!showControls)}
          title="Hướng dẫn điều khiển"
          className={`w-10 h-10 flex items-center justify-center backdrop-blur-sm rounded-xl border transition-all hover:scale-105 ${
            showControls
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-black/60 border-white/10 text-slate-300 hover:bg-white/20"
          }`}
        >
          <Keyboard size={17} />
        </button>
      </div>

      {/* ── Player list panel ── */}
      {showPlayers && (
        <div className="absolute top-16 right-4 z-20 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden w-52 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
            <span className="text-xs text-white font-semibold">Người trong phòng</span>
            <button onClick={() => setShowPlayers(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={13} />
            </button>
          </div>
          {/* Self */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-pink-600/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[11px] text-white font-bold shadow">
              B
            </div>
            <div>
              <p className="text-xs text-white font-medium">Bạn</p>
              <p className="text-[10px] text-pink-400">Chủ phòng</p>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {playerList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có ai khác</p>
            ) : (
              playerList.map((p) => (
                <div key={p.userId} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-[11px] text-white font-bold shadow">
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-white truncate">{p.username}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Controls help panel ── */}
      {showControls && (
        <div className="absolute top-16 right-16 z-20 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden w-56 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
            <span className="text-xs text-white font-semibold">Điều khiển</span>
            <button onClick={() => setShowControls(false)} className="text-slate-400 hover:text-white">
              <X size={13} />
            </button>
          </div>
          <div className="p-3 space-y-1.5">
            {CONTROLS.map(({ key, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <kbd className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-md font-mono border border-white/20">
                  {key}
                </kbd>
                <span className="text-[11px] text-slate-300">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom bar toggle ── */}
      <button
        onClick={() => setShowBottomBar(!showBottomBar)}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 w-8 h-5 flex items-center justify-center bg-black/40 rounded-full text-slate-400 hover:text-white transition-colors"
      >
        {showBottomBar ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* ── Bottom bar: voice + emotes ── */}
      {showBottomBar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <EmoteBar onEmote={onEmote} />
          <VoiceBar
            isActive={voiceActive}
            isMuted={voiceMuted}
            onStart={onVoiceStart}
            onStop={onVoiceStop}
            onToggleMute={onVoiceMuteToggle}
          />
        </div>
      )}

      {/* ── Camera mode badge ── */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
          cameraMode === "first"
            ? "bg-indigo-600/80 text-white"
            : "bg-black/40 text-slate-400"
        }`}>
          {cameraMode === "first" ? "Góc nhìn thứ nhất" : "Góc nhìn thứ ba"}
        </div>
      </div>

      {/* ── Minimap ── */}
      {showMinimap && (
        <div className="absolute bottom-6 left-4 z-10">
          <Minimap
            playerPos={playerPos}
            playerRy={playerRy}
            remotePlayers={players}
          />
        </div>
      )}
    </>
  );
}
