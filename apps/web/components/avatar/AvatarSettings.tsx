"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { toast } from "sonner";
import { Upload, Save, User, Sparkles } from "lucide-react";
import AvatarViewer from "./AvatarViewerWrapper";

const POSES = ["idle", "wave", "sit", "dance"];
const EMOTIONS = ["neutral", "happy", "sad", "angry", "surprised"];

// Avatar mẫu miễn phí — VRM format
const SAMPLE_AVATARS = [
  {
    name: "Alicia",
    url: "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Alicia_Solid.vrm",
    thumb: "https://i.imgur.com/8QzKxZm.png",
    desc: "Anime girl — VRM Consortium",
  },
  {
    name: "Three-VRM Girl",
    url: "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/three-vrm-girl.vrm",
    thumb: "https://i.imgur.com/9QzKxZm.png",
    desc: "Stylized anime character",
  },
];

export default function AvatarSettings() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: avatar } = useQuery({
    queryKey: ["my-avatar"],
    queryFn: () => apiClient.get("/avatars/me").then((r) => r.data?.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("vrm", file);
      return apiClient.post("/avatars/me/upload-vrm", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res) => {
      toast.success("Upload VRM thành công!");
      setPreviewUrl(res.data?.data?.vrmUrl ?? null);
      qc.invalidateQueries({ queryKey: ["my-avatar"] });
    },
    onError: () => toast.error("Upload thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/avatars/me", data),
    onSuccess: () => {
      toast.success("Đã lưu cấu hình avatar!");
      qc.invalidateQueries({ queryKey: ["my-avatar"] });
    },
    onError: () => toast.error("Lưu thất bại"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".vrm")) {
      toast.error("Chỉ chấp nhận file .vrm");
      return;
    }
    uploadMutation.mutate(file);
  };

  const vrmUrl = previewUrl ?? avatar?.vrmUrl;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Xem trước avatar</h3>
        {vrmUrl ? (
          <AvatarViewer url={vrmUrl} />
        ) : (
          <div className="w-full aspect-[3/4] rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 dark:border-slate-700">
            <User size={48} className="text-slate-400" />
            <p className="text-sm text-slate-400">Chưa có avatar VRM</p>
          </div>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          {uploadMutation.isPending ? "Đang upload..." : "Upload file .vrm"}
        </button>
        <input ref={fileRef} type="file" accept=".vrm" className="hidden" onChange={handleFileChange} />
        <p className="text-xs text-slate-400 text-center">Tối đa 50MB. Tạo avatar tại VRoid Studio</p>

        {/* Sample avatars */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-pink-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avatar mẫu miễn phí</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_AVATARS.map((a) => (
              <button
                key={a.name}
                onClick={() => {
                  setPreviewUrl(a.url);
                  updateMutation.mutate({ vrmUrl: a.url, displayName: a.name });
                }}
                className={`p-2 rounded-xl border text-left transition-all ${
                  vrmUrl === a.url
                    ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-pink-400"
                }`}
              >
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-indigo-100 to-pink-100 dark:from-indigo-900/30 dark:to-pink-900/30 flex items-center justify-center mb-1.5">
                  <User size={28} className="text-indigo-400" />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cấu hình</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Tên hiển thị</label>
            <input
              defaultValue={avatar?.displayName ?? ""}
              id="avatar-display-name"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Tên avatar của bạn"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Pose mặc định</label>
            <select
              defaultValue={avatar?.pose ?? "idle"}
              id="avatar-pose"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {POSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Cảm xúc mặc định</label>
            <select
              defaultValue={avatar?.emotion ?? "neutral"}
              id="avatar-emotion"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {EMOTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="avatar-public"
              defaultChecked={avatar?.isPublic ?? true}
              className="rounded border-slate-300 text-pink-600 focus:ring-pink-600"
            />
            <label htmlFor="avatar-public" className="text-sm text-slate-600 dark:text-slate-400">
              Cho phép người khác xem avatar của tôi
            </label>
          </div>
        </div>

        <button
          onClick={() => {
            const displayName = (document.getElementById("avatar-display-name") as HTMLInputElement)?.value;
            const pose = (document.getElementById("avatar-pose") as HTMLSelectElement)?.value;
            const emotion = (document.getElementById("avatar-emotion") as HTMLSelectElement)?.value;
            const isPublic = (document.getElementById("avatar-public") as HTMLInputElement)?.checked;
            updateMutation.mutate({ displayName, pose, emotion, isPublic });
          }}
          disabled={updateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {updateMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
