"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { toast } from "sonner";
import { Save, Trash2, RotateCcw } from "lucide-react";
import AssetLibrary from "./AssetLibrary";

export interface PlacedDecor {
  id: string;
  assetId: string;
  name: string;
  modelUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

interface RoomEditorProps {
  roomId: string;
  decors: PlacedDecor[];
  onDecorsChange: (decors: PlacedDecor[]) => void;
  onClose: () => void;
}

export default function RoomEditor({ roomId, decors, onDecorsChange, onClose }: RoomEditorProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => apiClient.post(`/rooms/${roomId}/decors`, { decors }),
    onSuccess: () => toast.success("Đã lưu phòng!"),
    onError: () => toast.error("Lưu thất bại"),
  });

  const handleAddAsset = useCallback((asset: any) => {
    const newDecor: PlacedDecor = {
      id: `decor_${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      modelUrl: asset.modelUrl,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: asset.scale ?? 1,
    };
    onDecorsChange([...decors, newDecor]);
    setShowLibrary(false);
    toast.success(`Đã thêm ${asset.name}`);
  }, [decors, onDecorsChange]);

  const handleRemove = useCallback((id: string) => {
    onDecorsChange(decors.filter((d) => d.id !== id));
    if (selected === id) setSelected(null);
  }, [decors, onDecorsChange, selected]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/10">
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Thêm đồ vật
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save size={12} />
          {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          onClick={onClose}
          className="ml-auto text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          Xong
        </button>
      </div>

      {/* Placed items list */}
      {decors.length > 0 && (
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden max-h-48 overflow-y-auto">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-xs text-slate-400 font-medium">Đồ vật đã đặt ({decors.length})</span>
          </div>
          {decors.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelected(d.id === selected ? null : d.id)}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                selected === d.id ? "bg-pink-600/20" : "hover:bg-white/5"
              }`}
            >
              <span className="text-xs text-white">{d.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(d.id); }}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Asset Library panel */}
      {showLibrary && (
        <div className="absolute bottom-full mb-2 right-0">
          <AssetLibrary onSelect={handleAddAsset} onClose={() => setShowLibrary(false)} />
        </div>
      )}
    </div>
  );
}
