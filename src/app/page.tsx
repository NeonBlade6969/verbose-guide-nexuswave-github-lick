"use client";

import { useState, useEffect } from "react";
import { Sparkles, Users, Flame, Film, Image as ImageIcon } from "lucide-react";
import { FeedCard } from "@/components/feed/FeedCard";
import { CommentSection } from "@/components/comments/CommentSection";
import { Post } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePosts } from "@/lib/hooks/usePosts";
import { ensureSeedDataInitialized } from "@/lib/firebase/firestore";

export default function HomePage() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<"foryou" | "following">("foryou");
  const [activeCommentsPost, setActiveCommentsPost] = useState<Post | null>(null);

  const { posts, loading } = usePosts(filter, currentUser?.uid);

  useEffect(() => {
    ensureSeedDataInitialized();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Feed Filter Switcher (For You vs Following) */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5 sticky top-[57px] bg-[#09090B]/90 backdrop-blur-md z-20">
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            onClick={() => setFilter("foryou")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "foryou"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            For You
          </button>

          <button
            onClick={() => setFilter("following")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "following"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Following
          </button>
        </div>

        {/* Quick Format Stats Pills */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5">
            <Film className="w-3 h-3 text-indigo-400" /> Videos
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5">
            <Flame className="w-3 h-3 text-red-400" /> Shorts
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5">
            <ImageIcon className="w-3 h-3 text-purple-400" /> GIFs
          </span>
        </div>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Curating your NexusWave feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121216] border border-white/5 p-8 space-y-3">
          <p className="text-sm font-semibold text-white">
            {filter === "following"
              ? "You aren't following anyone with new posts yet!"
              : "No posts found."}
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {filter === "following"
              ? "Check out suggested creators on the right sidebar or switch to the 'For You' feed to discover new videos & GIFs."
              : "Be the first to upload a video, short clip, or animated GIF!"}
          </p>
          {filter === "following" && (
            <button
              onClick={() => setFilter("foryou")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Explore For You
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              onOpenComments={(selected) => setActiveCommentsPost(selected)}
            />
          ))}
        </div>
      )}

      {/* Slide-over Comments Drawer Modal */}
      {activeCommentsPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <CommentSection
              postId={activeCommentsPost.id}
              onClose={() => setActiveCommentsPost(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
