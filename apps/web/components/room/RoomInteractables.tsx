"use client";

import InteractableObject from "./InteractableObject";
import NPC from "./NPC";
import type { FurnitureItemData } from "./ui/ItemInfoPanel";
import type { DialogueTree } from "./ui/DialogueBox";
import * as THREE from "three";

// ── NPC dialogues ─────────────────────────────────────────────────────────────
const hanaDialogue: DialogueTree = {
  start: "h1",
  nodes: {
    h1: { id: "h1", speaker: "Hana", speakerIcon: "🌸", text: "Chào bạn! Phòng của bạn trông thật đẹp hôm nay ✨", next: "h2" },
    h2: { id: "h2", speaker: "Hana", speakerIcon: "🌸", text: "Bạn đã xem anime mới nhất chưa? Mình vừa xem xong và cảm xúc lắm 😭", next: "h3" },
    h3: { id: "h3", speaker: "Hana", speakerIcon: "🌸", text: "Hẹn gặp lại nhé! Đừng quên trang trí thêm phòng cho đẹp hơn 🏠" },
  },
};

const ryuDialogue: DialogueTree = {
  start: "r1",
  nodes: {
    r1: { id: "r1", speaker: "Ryu", speakerIcon: "⚔️", text: "Oi! Bạn mới vào phòng à? Mình đang luyện tập kỹ năng đây.", next: "r2" },
    r2: { id: "r2", speaker: "Ryu", speakerIcon: "⚔️", text: "Nếu muốn tham gia club anime, hãy ghé qua trang Clubs nhé!", next: "r3" },
    r3: { id: "r3", speaker: "Ryu", speakerIcon: "⚔️", text: "Ja ne! 👊" },
  },
};

// ── Furniture items ───────────────────────────────────────────────────────────
const ITEMS: FurnitureItemData[] = [
  {
    id: "bed_01",
    name: "Giường Anime Fantasy",
    description: "Chiếc giường mềm mại với chăn màu tím huyền bí. Ngủ ngon sẽ giúp bạn mơ thấy thế giới anime.",
    type: "Giường",
    rarity: "epic",
    price: 2400,
    icon: "🛏️",
  },
  {
    id: "desk_01",
    name: "Bàn Học Otaku",
    description: "Bàn học với màn hình phát sáng và figure anime. Nơi lý tưởng để vẽ fanart và viết fanfic.",
    type: "Bàn",
    rarity: "rare",
    price: 1200,
    icon: "🖥️",
  },
  {
    id: "bookshelf_01",
    name: "Kệ Sách Manga",
    description: "Kệ sách chứa đầy manga và light novel. Mỗi cuốn là một thế giới mới chờ khám phá.",
    type: "Kệ",
    rarity: "rare",
    price: 900,
    icon: "📚",
  },
  {
    id: "tv_01",
    name: "TV Anime Stream",
    description: "Màn hình lớn để xem anime cùng bạn bè trong phòng. Hỗ trợ watch party realtime.",
    type: "TV",
    rarity: "epic",
    price: 3200,
    icon: "📺",
  },
  {
    id: "wardrobe_01",
    name: "Tủ Quần Áo Cosplay",
    description: "Tủ đựng trang phục cosplay các nhân vật anime yêu thích. Mở ra để thay đồ cho avatar.",
    type: "Tủ",
    rarity: "legendary",
    price: 5000,
    icon: "👗",
  },
  {
    id: "plushie_01",
    name: "Thú Bông Kawaii",
    description: "Thú bông dễ thương nhảy múa theo nhạc. Đặt trong phòng để tăng điểm vibe anime.",
    type: "Trang trí",
    rarity: "common",
    price: 300,
    icon: "🧸",
  },
  {
    id: "rug_01",
    name: "Thảm Anime Circle",
    description: "Thảm tròn với họa tiết anime đặc trưng. Làm điểm nhấn cho trung tâm căn phòng.",
    type: "Thảm",
    rarity: "rare",
    price: 750,
    icon: "🎯",
  },
];

interface Props {
  playerPosRef?: React.RefObject<THREE.Vector3>;
  onSelectItem: (item: FurnitureItemData) => void;
  onNPCTalk: (dialogue: DialogueTree, name: string) => void;
}

export default function RoomInteractables({ playerPosRef, onSelectItem, onNPCTalk }: Props) {
  return (
    <group>
      {/* ── NPCs ── */}
      <NPC
        data={{ id: "hana", name: "Hana", icon: "🌸", position: [-3, 0, 2], color: "#ec4899", dialogue: hanaDialogue }}
        onTalk={onNPCTalk}
      />
      <NPC
        data={{ id: "ryu", name: "Ryu", icon: "⚔️", position: [3, 0, 2], color: "#6366f1", dialogue: ryuDialogue }}
        onTalk={onNPCTalk}
      />

      {/* ── Interactable furniture ── */}
      <InteractableObject position={[-7, 0.5, -7]} item={ITEMS[0]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
      <InteractableObject position={[7, 0.5, -7]} item={ITEMS[1]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
      <InteractableObject position={[-9.5, 1.6, 0]} item={ITEMS[2]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
      <InteractableObject position={[0, 0.5, -9.5]} item={ITEMS[3]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
      <InteractableObject position={[-9, 2, -8]} item={ITEMS[4]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
      <InteractableObject position={[0, 0.22, 3]} scale={0.8} item={ITEMS[5]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
      <InteractableObject position={[0, 0.01, 0]} scale={1.2} item={ITEMS[6]} playerPosRef={playerPosRef} onSelect={onSelectItem} />
    </group>
  );
}
