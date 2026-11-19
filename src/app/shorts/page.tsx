"use client";

import { usePosts } from "@/lib/hooks/usePosts";
import { ShortsPlayer } from "@/components/shorts/ShortsPlayer";

export default function ShortsPage() {
  const { posts, loading } = usePosts("foryou");

  const shorts = posts.filter((p) => p.type === "short_video");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500">Loading Shorts feed...</p>
      </div>
    );
  }

  return <ShortsPlayer shorts={shorts} />;
}
