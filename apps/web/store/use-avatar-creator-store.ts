import { create } from "zustand";

export type CreatorTab = "hair" | "face" | "outfit" | "accessory" | "pose";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface CreatorItem {
  id: string;
  name: string;
  rarity: Rarity;
  color?: string;
  previewColor?: string;
}

export interface AvatarCreatorState {
  tab: CreatorTab;
  selectedItems: Record<CreatorTab, string | null>;
  colors: {
    hair: string;
    skin: string;
    outfit: string;
    eyes: string;
  };
  pose: string;

  setTab: (tab: CreatorTab) => void;
  selectItem: (tab: CreatorTab, id: string) => void;
  setColor: (key: keyof AvatarCreatorState["colors"], value: string) => void;
  setPose: (pose: string) => void;
  reset: () => void;
}

const DEFAULT_COLORS = {
  hair: "#7c3aed",
  skin: "#fde68a",
  outfit: "#6366f1",
  eyes: "#3b82f6",
};

export const useAvatarCreatorStore = create<AvatarCreatorState>((set) => ({
  tab: "hair",
  selectedItems: { hair: "h1", face: "f1", outfit: "o1", accessory: null, pose: "idle" },
  colors: DEFAULT_COLORS,
  pose: "idle",

  setTab: (tab) => set({ tab }),
  selectItem: (tab, id) =>
    set((s) => ({ selectedItems: { ...s.selectedItems, [tab]: id } })),
  setColor: (key, value) =>
    set((s) => ({ colors: { ...s.colors, [key]: value } })),
  setPose: (pose) => set({ pose }),
  reset: () =>
    set({
      selectedItems: { hair: "h1", face: "f1", outfit: "o1", accessory: null, pose: "idle" },
      colors: DEFAULT_COLORS,
      pose: "idle",
    }),
}));
