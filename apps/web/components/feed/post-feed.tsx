"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";

export function PostFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data } = await apiClient.get("/posts/feed");
      return data.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-pink-600" size={28} />
      </div>
    );
  }

  if (!data?.posts?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <p className="text-slate-500 text-sm">Chưa có bài đăng nào. Hãy theo dõi thêm bạn bè!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.posts.map((post: any) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
