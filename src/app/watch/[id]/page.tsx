"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TheaterPlayer } from "@/components/watch/TheaterPlayer";
import { usePosts } from "@/lib/hooks/usePosts";
import { Post } from "@/lib/types";

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const { posts, loading } = usePosts("foryou");

  const post = posts.find((p) => p.id === postId);
  const recommended = posts.filter((p) => p.id !== postId && p.type === "long_video");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500">Loading theater mode...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4 px-4">
        <h2 className="text-xl font-bold text-white">Video not found</h2>
        <p className="text-xs text-zinc-400">
          The video may have been removed or the link is invalid.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  return <TheaterPlayer post={post} recommended={recommended} />;
}
