"use client";

import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { useAuthStore } from "../../store/use-auth-store";
import { useRoomSocket } from "../../hooks/useRoomSocket";
import { useVoiceChat } from "../../hooks/useVoiceChat";
import { useLipSync } from "../../hooks/useLipSync";
import PlayerController, { PlayerControllerHandle } from "./PlayerController";
import CameraController from "./CameraController";
import RemotePlayer from "./RemotePlayer";
import RoomHUD from "./RoomHUD";
import RoomEditor, { PlacedDecor } from "./RoomEditor";
import RoomEnvironment from "./RoomEnvironment";
import PostProcessing from "./PostProcessing";
import PointerLockOverlay from "./PointerLockOverlay";
import MobileControls from "./MobileControls";
import QualitySettings, { GraphicsQuality } from "./QualitySettings";
import DressingRoom from "./DressingRoom";
import { VignetteOverlay } from "./PostProcessing";
import PhotoModeOverlay from "./PhotoModeOverlay";
import RoomThemePresets, { ROOM_THEMES, RoomTheme } from "./RoomThemePresets";
import CharacterCreatorModal from "../avatar/CharacterCreatorModal";
import RoomInteractables from "./RoomInteractables";
import ItemInfoPanel, { FurnitureItemData } from "./ui/ItemInfoPanel";
import DialogueBox, { DialogueTree } from "./ui/DialogueBox";
import { introDialogue } from "./systems/dialogue";
import CombatHUD from "./CombatHUD";
import { CombatSystem } from "./CombatSystem";
import AICharacter from "./AICharacter";
import { ROOM_NPCS } from "./AICompanion";

interface RoomSceneProps {
  roomId: string;
}

function Crosshair({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="relative w-6 h-6">
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/80 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/80 -translate-x-1/2" />
        <div className="absolute inset-0 rounded-full border border-white/40" style={{ width: 8, height: 8, margin: "auto" }} />
      </div>
    </div>
  );
}

function MapLoadingOverlay() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
      <div className="text-white text-sm mb-3 opacity-80">Đang tải map...</div>
      <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-white/50 text-xs mt-2">{Math.round(progress)}%</div>
    </div>
  );
}

function ThirdPersonHint() {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);
  if (!locked) return null;
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-white/50">
        <span>🖱️ Di chuột để xoay camera</span>
        <span className="text-white/30">·</span>
        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">ESC</kbd>
        <span>mở khóa</span>
      </div>
    </div>
  );
}

export default function RoomScene({ roomId }: RoomSceneProps) {
  const { user } = useAuthStore();
  const playerHandleRef = useRef<PlayerControllerHandle>(null);
  const playerPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerVec3Ref = useRef<THREE.Vector3>(new THREE.Vector3());
  const playerRyRef  = useRef(0);
  const remotePosRef = useRef<Map<string, { x: number; z: number }>>(new Map());

  const [cameraMode, setCameraMode] = useState<"third" | "first">("third");
  const [cameraYaw, setCameraYaw] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showDressing, setShowDressing] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [activeTheme, setActiveTheme] = useState<RoomTheme>(ROOM_THEMES[0]);
  const [decors, setDecors] = useState<PlacedDecor[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [quality, setQuality] = useState<GraphicsQuality>("medium");
  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Avatar appearance state
  const [clothColor, setClothColor] = useState("#6366f1");
  const [hairColor, setHairColor] = useState("#7c3aed");
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
  const [playerRy, setPlayerRy] = useState(0);

  // Item info panel + dialogue
  const [selectedItem, setSelectedItem] = useState<FurnitureItemData | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{ tree: DialogueTree; name: string } | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Combat system
  const combatRef = useRef(new CombatSystem(user?.id ?? "local", 100));
  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => apiClient.get(`/rooms/${roomId}`).then((r) => r.data?.data),
    enabled: !!roomId,
  });

  // Fetch current user's avatar (for vrmUrl)
  const { data: myAvatar } = useQuery({
    queryKey: ["my-avatar"],
    queryFn: () => apiClient.get("/avatars/me").then((r) => r.data?.data),
    enabled: !!user,
  });

  const myVrmUrl: string | undefined = myAvatar?.vrmUrl ?? undefined;

  useEffect(() => {
    if (roomData?.decors) {
      setDecors(
        roomData.decors.map((d: any) => ({
          id: d.id,
          assetId: d.assetId,
          name: d.asset?.name ?? d.type,
          modelUrl: d.assetUrl ?? d.asset?.assetUrl ?? "",
          position: [d.posX, d.posY, d.posZ] as [number, number, number],
          rotation: [0, d.rotY, 0] as [number, number, number],
          scale: d.scale,
        }))
      );
    }
  }, [roomData]);

  const { connected, players, sendMove, sendEmote, sendDecorUpdate, sendCombatEvent } = useRoomSocket({
    roomId,
    onDecorUpdate: (newDecors) => setDecors(newDecors),
    onCombatEvent: (event) => {
      // Nhận damage từ player khác
      if (event.type === "damage" && event.targetId === user?.id) {
        combatRef.current.takeDamage(event.amount ?? 10, event.attackerId ?? "unknown");
      }
    },
  });

  const getLocalPosition = useCallback(() => playerPosRef.current, []);
  const getRemotePosition = useCallback(
    (userId: string) => remotePosRef.current.get(userId) ?? null,
    []
  );
  const handleSpeakingChange = useCallback((userId: string, speaking: boolean) => {
    setSpeakingUsers((prev) => {
      const next = new Set(prev);
      speaking ? next.add(userId) : next.delete(userId);
      return next;
    });
  }, []);

  const voice = useVoiceChat({
    roomId,
    getLocalPosition,
    getRemotePosition,
    onSpeakingChange: handleSpeakingChange,
  });
  const { mouthOpen } = useLipSync(localStream);

  const handleVoiceStart = useCallback(async () => {
    await voice.start();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
    } catch {}
  }, [voice]);

  const handleVoiceStop = useCallback(() => {
    voice.stop();
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
  }, [voice, localStream]);

  const handleMove = useCallback(
    (state: { x: number; y: number; z: number; ry: number }) => {
      playerPosRef.current = { x: state.x, z: state.z };
      playerVec3Ref.current.set(state.x, state.y, state.z);
      playerRyRef.current  = state.ry;
      setPlayerPos({ x: state.x, z: state.z });
      setPlayerRy(state.ry);
      sendMove([state.x, state.y, state.z], state.ry);
    },
    [sendMove]
  );

  const handleDecorsChange = useCallback(
    (newDecors: PlacedDecor[]) => {
      setDecors(newDecors);
      sendDecorUpdate(newDecors);
    },
    [sendDecorUpdate]
  );

  useEffect(() => {
    players.forEach((p, userId) => {
      remotePosRef.current.set(userId, { x: p.position[0], z: p.position[2] });
    });
  }, [players]);

  // V key — toggle camera
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "v") {
        setCameraMode((m) => (m === "third" ? "first" : "third"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isOwner = roomData?.ownerId === user?.id;
  const roomName = roomData?.name ?? "Phòng";

  return (
    <div className="relative w-full h-full bg-[#c8e6ff] overflow-hidden">
      {/* Map loading progress */}
      <MapLoadingOverlay />

      {/* Pointer lock overlay */}
      <PointerLockOverlay />

      {/* Crosshair (first-person only) */}
      <Crosshair visible={cameraMode === "first"} />

      {/* Third-person lock hint */}
      {cameraMode === "third" && <ThirdPersonHint />}

      {/* Connection dot */}
      <div
        className={`absolute top-4 left-4 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
          connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        }`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            connected ? "bg-green-400 animate-pulse" : "bg-red-400"
          }`}
        />
        {connected ? "Online" : "Kết nối..."}
      </div>

      {/* Quality settings */}
      <div className="absolute top-4 right-56 z-10">
        <QualitySettings quality={quality} onChange={setQuality} />
      </div>

      {/* Canvas */}
      <Canvas
        shadows={quality !== "low"}
        camera={{ position: [0, 3, 6], fov: 60, near: 0.1, far: 200 }}
        gl={{
          antialias: quality !== "low",
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#c8e6ff" as any]} />

          <Physics gravity={[0, -20, 0]} timeStep="vary">
            <RoomEnvironment
              wallColor={activeTheme.wallColor}
              floorColor={activeTheme.floorColor}
              accentColor={activeTheme.accentColor}
              ambientColor={activeTheme.ambientColor}
              rimColor={activeTheme.rimColor}
              fogColor={activeTheme.fogColor}
              useGLBMap={true}
              playerPosRef={playerVec3Ref}
            />
          </Physics>

          <PlayerController
            ref={playerHandleRef}
            onMove={handleMove}
            username={user?.username ?? "Bạn"}
            isSpeaking={!!localStream && mouthOpen > 0.1}
            mouthOpen={mouthOpen}
            cameraMode={cameraMode}
            cameraYaw={cameraYaw}
            clothColor={clothColor}
            hairColor={hairColor}
            vrmUrl={myVrmUrl}
          />

          <CameraController
            targetRef={playerHandleRef}
            mode={cameraMode}
            onYawChange={setCameraYaw}
          />

          {Array.from(players.values()).map((p) => (            <RemotePlayer
              key={p.userId}
              state={{
                x: p.position[0],
                y: p.position[1],
                z: p.position[2],
                ry: p.rotation,
              }}
              username={p.username}
              emote={p.emote}
              isSpeaking={speakingUsers.has(p.userId)}
              vrmUrl={p.vrmUrl}
              hairColor={p.hairColor}
              clothColor={p.clothColor}
              hp={p.hp}
            />
          ))}

          {quality !== "low" && <PostProcessing quality={quality} />}

          {/* Interactable objects + NPCs */}
          <RoomInteractables
            playerPosRef={playerVec3Ref}
            onSelectItem={(item) => { setSelectedItem(item); setActiveDialogue(null); }}
            onNPCTalk={(tree, name) => { setActiveDialogue({ tree, name }); setSelectedItem(null); setShowIntro(false); }}
          />

          {/* AI NPC Characters */}
          {ROOM_NPCS.map((npc, i) => (
            <AICharacter
              key={npc.id}
              config={npc}
              position={[
                i === 0 ? -4 : i === 1 ? 4 : 0,
                0,
                i === 0 ? -3 : i === 1 ? -3 : -6,
              ]}
              playerPosRef={playerVec3Ref}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Vignette overlay */}
      {quality !== "low" && <VignetteOverlay intensity={0.4} />}

      {/* Combat HUD */}
      <CombatHUD
        combat={combatRef.current}
        onSkill={(skillId) => {
          const myPos = playerVec3Ref.current;
          // Build targets từ remote players
          const targets = Array.from(players.values()).map((p) => ({
            id: p.userId,
            position: new THREE.Vector3(p.position[0], p.position[1], p.position[2]),
            combat: new CombatSystem(p.userId, p.maxHp ?? 100),
          }));
          const used = combatRef.current.useSkill(skillId, myPos, targets, Date.now());
          if (used) sendCombatEvent({ type: "skill", skillId });
        }}
      />

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <RoomHUD
            roomId={roomId}
            roomName={roomName}
            players={players}
            isOwner={isOwner}
            onEmote={(key) => {
              playerHandleRef.current?.playEmote(key);
              sendEmote(key);
            }}
            onToggleEdit={() => setIsEditing(!isEditing)}
            isEditing={isEditing}
            onToggleCamera={() =>
              setCameraMode((m) => (m === "third" ? "first" : "third"))
            }
            cameraMode={cameraMode}
            onOpenDressing={() => setShowDressing(true)}
            onOpenPhotoMode={() => setShowPhotoMode(true)}
            onOpenThemes={() => setShowThemes(true)}
            onOpenCharacterCreator={() => setShowCharacterCreator(true)}
            voiceActive={voice.isActive}
            voiceMuted={voice.isMuted}
            onVoiceStart={handleVoiceStart}
            onVoiceStop={handleVoiceStop}
            onVoiceMuteToggle={voice.toggleMute}
            playerPos={playerPos}
            playerRy={playerRy}
          />
        </div>
      </div>

      {/* Mobile controls */}
      <MobileControls
        onJoystick={(x, y) => {
          joystickRef.current = { x, y };
        }}
        onJoystickStop={() => {
          joystickRef.current = { x: 0, y: 0 };
        }}
        onJump={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
        }}
      />

      {/* Room editor */}
      {isEditing && (
        <div className="absolute bottom-32 left-4 z-20">
          <RoomEditor
            roomId={roomId}
            decors={decors}
            onDecorsChange={handleDecorsChange}
            onClose={() => setIsEditing(false)}
          />
        </div>
      )}

      {/* Dressing room overlay */}
      {showDressing && (
        <DressingRoom
          initialClothColor={clothColor}
          initialHairColor={hairColor}
          onApply={(cloth, hair, _outfitId) => {
            setClothColor(cloth);
            setHairColor(hair);
            setShowDressing(false);
          }}
          onClose={() => setShowDressing(false)}
        />
      )}

      {/* Photo mode overlay */}
      {showPhotoMode && (
        <PhotoModeOverlay onClose={() => setShowPhotoMode(false)} />
      )}

      {/* Theme presets */}
      {showThemes && (
        <RoomThemePresets
          roomId={roomId}
          currentTheme={activeTheme.id}
          onApply={(theme) => { setActiveTheme(theme); setShowThemes(false); }}
          onClose={() => setShowThemes(false)}
        />
      )}

      {/* Character creator */}
      {showCharacterCreator && (
        <CharacterCreatorModal onClose={() => setShowCharacterCreator(false)} />
      )}

      {/* Item info panel */}
      {selectedItem && (
        <ItemInfoPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onInteract={() => setSelectedItem(null)}
        />
      )}

      {/* Intro dialogue */}
      {showIntro && !activeDialogue && (
        <DialogueBox
          tree={introDialogue}
          onFinish={() => setShowIntro(false)}
        />
      )}

      {/* NPC dialogue */}
      {activeDialogue && (
        <DialogueBox
          tree={activeDialogue.tree}
          onFinish={() => setActiveDialogue(null)}
        />
      )}
    </div>
  );
}
