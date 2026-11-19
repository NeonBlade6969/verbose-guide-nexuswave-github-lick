"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Play, Flame, Film, Image as ImageIcon, Check } from "lucide-react";
import { Post } from "@/lib/types";
import { formatViews, formatTimeAgo, formatDuration } from "@/lib/utils";
import { AutoplayVideo } from "./AutoplayVideo";
import { toggleLikePost, toggleFollow, subscribeToFollows } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect } from "react";

interface FeedCardProps {
  post: Post;
  onOpenComments: (post: Post) => void;
  onShareToChat?: (post: Post) => void;
}

export function FeedCard({ post, onOpenComments, onShareToChat }: FeedCardProps) {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(post.likedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToFollows(currentUser.uid, (followingIds) => {
      setIsFollowing(followingIds.includes(post.authorId));
    });
    return () => unsub();
  }, [currentUser, post.authorId]);

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
    if (onShareToChat) {
      onShareToChat(post);
    } else {
      navigator.clipboard?.writeText(window.location.origin + `/watch/${post.id}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const isLongVideo = post.type === "long_video";
  const isShort = post.type === "short_video";
  const isGif = post.type === "gif";

  return (
    <article className="w-full max-w-xl mx-auto rounded-2xl bg-[#121216] border border-white/5 overflow-hidden shadow-lg transition-all hover:border-white/10 mb-6">
      {/* Creator Header */}
      <div className="p-3.5 flex items-center justify-between">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex items-center gap-3 group/author"
        >
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 group-hover/author:ring-indigo-400 transition-all"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white group-hover/author:text-indigo-400 transition-colors">
                {post.author.displayName}
              </span>
              <span className="text-xs text-zinc-400">@{post.author.username}</span>
            </div>
            <p className="text-[11px] text-zinc-500">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {currentUser && currentUser.uid !== post.authorId && (
          <button
            onClick={handleFollowToggle}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isFollowing
                ? "bg-white/10 text-zinc-300 hover:bg-white/15"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Media Display Area */}
      {isLongVideo ? (
        <Link href={`/watch/${post.id}`} className="block relative group/thumb">
          <div className="relative aspect-video w-full bg-black overflow-hidden">
            <img
              src={post.thumbnailUrl || post.mediaUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
            </div>

            {/* Video Badges */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1">
              <Film className="w-3 h-3 text-indigo-400" />
              Video
            </div>

            {post.duration && (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-medium text-white">
                {formatDuration(post.duration)}
              </div>
            )}
          </div>
        </Link>
      ) : isShort ? (
        <Link href={`/shorts`} className="block">
          <div className="relative max-h-[580px] w-full bg-black">
            <AutoplayVideo
              src={post.mediaUrl}
              poster={post.thumbnailUrl}
              aspectRatio="9/16"
              className="max-h-[580px] mx-auto rounded-lg"
            />
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600/90 text-[11px] font-bold text-white flex items-center gap-1">
              <Flame className="w-3 h-3 fill-white" />
              SHORT
            </div>
          </div>
        </Link>
      ) : isGif ? (
        <div className="relative w-full bg-black/40 overflow-hidden flex items-center justify-center">
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full max-h-[500px] object-contain"
          />
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-purple-600/90 text-[11px] font-bold text-white">
            GIF
          </div>
        </div>
      ) : (
        <div className="relative w-full bg-black/40 overflow-hidden">
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full max-h-[500px] object-cover"
          />
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-zinc-800/80 backdrop-blur-sm text-[11px] font-semibold text-white flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            Image
          </div>
        </div>
      )}

      {/* Post Information */}
      <div className="p-4 space-y-2.5">
        {isLongVideo ? (
          <Link href={`/watch/${post.id}`}>
            <h2 className="text-base font-bold text-white hover:text-indigo-400 transition-colors line-clamp-2">
              {post.title}
            </h2>
          </Link>
        ) : (
          <h2 className="text-sm font-semibold text-white">{post.title}</h2>
        )}

        {post.description && (
          <p className="text-xs text-zinc-400 line-clamp-2">{post.description}</p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Views & Metrics */}
        <div className="text-xs text-zinc-500 font-medium pt-1">
          {formatViews(post.viewsCount)}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              liked ? "text-pink-500" : "text-zinc-400 hover:text-pink-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-pink-500" : ""}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => onOpenComments(post)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-indigo-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount} Comments</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            title="Share post"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
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
    </article>
  );
}
