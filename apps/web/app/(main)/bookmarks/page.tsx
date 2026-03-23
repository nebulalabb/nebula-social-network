"use client";

import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2 } from "lucide-react";
import apiClient from "../../../lib/api-client";
import { PostCard } from "../../../components/feed/post-card";

export default function BookmarksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const { data } = await apiClient.get("/posts/bookmarks");
      return data.data?.posts || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Bookmark size={20} className="text-yellow-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Đã lưu</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-pink-600" size={24} />
        </div>
      ) : data?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Bookmark size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có bài đăng nào được lưu</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
