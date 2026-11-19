"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Heart,
  Share2,
  Bookmark,
  Check,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { Post } from "@/lib/types";
import { formatViews, formatDuration, formatTimeAgo } from "@/lib/utils";
import { toggleLikePost, toggleFollow, subscribeToFollows } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { CommentSection } from "@/components/comments/CommentSection";

interface TheaterPlayerProps {
  post: Post;
  recommended: Post[];
}

export function TheaterPlayer({ post, recommended }: TheaterPlayerProps) {
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(post.duration || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [liked, setLiked] = useState(post.likedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [copiedShare, setCopiedShare] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToFollows(currentUser.uid, (ids) => {
      setIsFollowing(ids.includes(post.authorId));
    });
    return () => unsub();
  }, [currentUser, post.authorId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTo = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 1);
    videoRef.current.currentTime = seekTo;
    setProgress(parseFloat(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen?.();
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    await toggleLikePost(post.id, currentUser.uid);
  };

  const handleFollowToggle = async () => {
    if (!currentUser || currentUser.uid === post.authorId) return;
    const res = await toggleFollow(currentUser.uid, post.authorId);
    setIsFollowing(res);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Cols: Main Player & Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Theater Video Player Box */}
        <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group/player">
          <video
            ref={videoRef}
            src={post.mediaUrl}
            poster={post.thumbnailUrl}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Center Play Overlay */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-600/50 hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Custom Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity">
            {/* Scrub slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleScrub}
              className="w-full h-1.5 bg-zinc-700 accent-indigo-500 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="hover:text-indigo-400">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <button onClick={() => setIsMuted(!isMuted)} className="hover:text-indigo-400">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <span>
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

              <button onClick={toggleFullscreen} className="hover:text-indigo-400">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Title & Meta Bar */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-white/5">
            {/* Author Subscribe Bar */}
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.author.username}`}>
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
                />
              </Link>
              <div>
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-bold text-sm text-white hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  {post.author.displayName}
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                </Link>
                <p className="text-xs text-zinc-400">@{post.author.username}</p>
              </div>

              {currentUser && currentUser.uid !== post.authorId && (
                <button
                  onClick={handleFollowToggle}
                  className={`ml-3 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    isFollowing
                      ? "bg-white/10 text-zinc-300 hover:bg-white/15"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                  }`}
                >
                  {isFollowing ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>

            {/* Interaction Buttons (Like, Share) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-colors ${
                  liked ? "text-pink-500 border-pink-500/30" : "text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-pink-500" : ""}`} />
                <span>{likesCount}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="p-4 rounded-2xl bg-[#121216] border border-white/5 text-xs text-zinc-300 space-y-2">
          <div className="flex items-center gap-3 font-semibold text-white text-xs">
            <span>{formatViews(post.viewsCount)}</span>
            <span>•</span>
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>

          <p className={`whitespace-pre-wrap leading-relaxed ${expandedDesc ? "" : "line-clamp-2"}`}>
            {post.description || "No description provided."}
          </p>

          {post.tags && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((t) => (
                <span key={t} className="text-indigo-400 font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setExpandedDesc(!expandedDesc)}
            className="text-zinc-400 hover:text-white font-bold pt-1 block"
          >
            {expandedDesc ? "Show less" : "...more"}
          </button>
        </div>

        {/* Embedded Rich Comments Section */}
        <div className="pt-4">
          <CommentSection postId={post.id} />
        </div>
      </div>

      {/* Right Column: Up Next / Recommended Videos */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Recommended
        </h3>

        <div className="space-y-3">
          {recommended.map((rec) => (
            <Link
              key={rec.id}
              href={`/watch/${rec.id}`}
              className="flex gap-3 group p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="relative w-36 aspect-video bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                <img
                  src={rec.thumbnailUrl || rec.mediaUrl}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {rec.duration && (
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] text-white">
                    {formatDuration(rec.duration)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-indigo-400 line-clamp-2 transition-colors">
                  {rec.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 truncate">
                  {rec.author.displayName}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {formatViews(rec.viewsCount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
