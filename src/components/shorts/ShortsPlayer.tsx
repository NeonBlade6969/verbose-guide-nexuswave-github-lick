"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Sparkles,
  X,
  Play,
  Check,
} from "lucide-react";
import { Post } from "@/lib/types";
import { toggleLikePost, toggleFollow, subscribeToFollows } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { CommentSection } from "@/components/comments/CommentSection";

interface ShortsPlayerProps {
  shorts: Post[];
}

export function ShortsPlayer({ shorts }: ShortsPlayerProps) {
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const currentShort = shorts[currentIndex];
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToFollows(currentUser.uid, (ids) => {
      const map: Record<string, boolean> = {};
      ids.forEach((id) => (map[id] = true));
      setFollowingMap(map);
    });
    return () => unsub();
  }, [currentUser]);

  // Keyboard Up/Down navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "m") {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shorts.length, showComments]);

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser || !currentShort) return;
    await toggleLikePost(currentShort.id, currentUser.uid);
  };

  const handleToggleFollow = async () => {
    if (!currentUser || !currentShort || currentUser.uid === currentShort.authorId) return;
    const isNowFollowing = await toggleFollow(currentUser.uid, currentShort.authorId);
    setFollowingMap((prev) => ({ ...prev, [currentShort.authorId]: isNowFollowing }));
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  if (!currentShort) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No Shorts available. Upload the first vertical short!
      </div>
    );
  }

  const isFollowing = followingMap[currentShort.authorId] || false;

  return (
    <div className="relative w-full h-[calc(100vh-65px)] flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Central Phone Viewport Container */}
      <div className="relative w-full max-w-[420px] h-full max-h-[820px] rounded-none sm:rounded-3xl overflow-hidden bg-zinc-950 shadow-2xl border-0 sm:border border-white/10 flex items-center justify-center">
        {/* Video Element */}
        <video
          ref={videoRef}
          key={currentShort.id}
          src={currentShort.mediaUrl}
          poster={currentShort.thumbnailUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => {
            if (!videoRef.current) return;
            if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }}
        />

        {/* Play/Pause Center Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
            <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Top Sound Toggle & Status Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            SHORTS
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white pointer-events-auto transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Bottom Metadata Overlay */}
        <div className="absolute bottom-4 left-4 right-16 z-20 space-y-2 pointer-events-none text-white drop-shadow-md">
          {/* Creator Profile & Follow */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <Link href={`/profile/${currentShort.author.username}`}>
              <img
                src={currentShort.author.avatarUrl}
                alt={currentShort.author.displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={`/profile/${currentShort.author.username}`}
                className="font-bold text-sm text-white hover:underline truncate block"
              >
                {currentShort.author.displayName}
              </Link>
              <p className="text-[11px] text-zinc-300">@{currentShort.author.username}</p>
            </div>

            {currentUser && currentUser.uid !== currentShort.authorId && (
              <button
                onClick={handleToggleFollow}
                className={`ml-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isFollowing
                    ? "bg-white/20 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/40"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Title & Tags */}
          <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed pointer-events-auto">
            {currentShort.title}
          </p>

          {currentShort.tags && (
            <div className="flex flex-wrap gap-1 pointer-events-auto">
              {currentShort.tags.map((t) => (
                <span key={t} className="text-[10px] text-indigo-300 font-semibold">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Floating Actions Bar */}
        <div className="absolute bottom-6 right-3 z-20 flex flex-col items-center gap-4 text-white">
          {/* Like */}
          <button
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md group-hover:scale-110 transition-all">
              <Heart
                className={`w-6 h-6 ${
                  currentShort.likedByCurrentUser ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </div>
            <span className="text-[11px] font-bold">{currentShort.likesCount}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md group-hover:scale-110 transition-all">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-bold">{currentShort.commentsCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md group-hover:scale-110 transition-all">
              {copiedShare ? (
                <Check className="w-6 h-6 text-emerald-400" />
              ) : (
                <Share2 className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-[11px] font-bold">
              {copiedShare ? "Copied" : "Share"}
            </span>
          </button>
        </div>

        {/* Slide-Over Comments Drawer */}
        {showComments && (
          <div className="absolute inset-0 z-30 flex flex-col bg-[#121216]/95 backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
            <CommentSection
              postId={currentShort.id}
              onClose={() => setShowComments(false)}
            />
          </div>
        )}
      </div>

      {/* Desktop Up/Down Navigation Buttons */}
      <div className="hidden lg:flex flex-col gap-2 ml-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all shadow-lg"
          title="Previous Short (Up Arrow)"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === shorts.length - 1}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all shadow-lg"
          title="Next Short (Down Arrow)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
