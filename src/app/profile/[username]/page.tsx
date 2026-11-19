"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Flame,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users,
  Play,
} from "lucide-react";
import { fetchUserProfile, toggleFollow, subscribeToFollows } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePosts } from "@/lib/hooks/usePosts";
import { UserProfile, Post } from "@/lib/types";
import { formatCount, formatDuration, formatViews } from "@/lib/utils";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);
  const { currentUser, loading: authLoading } = useAuth();
  const { posts } = usePosts("foryou");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"videos" | "shorts" | "gifs">("videos");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // 1. If visited channel matches currently authenticated user (handle or UID)
    if (
      currentUser &&
      (currentUser.username.toLowerCase() === username.toLowerCase() ||
        currentUser.uid === username)
    ) {
      setProfile(currentUser);
      setFollowersCount(currentUser.followersCount);
      setLoading(false);
      return;
    }

    // 2. If auth is still resolving on initial page load, hold loading
    if (authLoading) {
      setLoading(true);
      return;
    }

    // 3. Otherwise fetch from Firestore or local fallback
    setLoading(true);
    fetchUserProfile(username).then((p) => {
      if (!isMounted) return;
      if (p) {
        setProfile(p);
        setFollowersCount(p.followersCount);
      } else if (
        currentUser &&
        (currentUser.username.toLowerCase() === username.toLowerCase() ||
          currentUser.uid === username)
      ) {
        setProfile(currentUser);
        setFollowersCount(currentUser.followersCount);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [username, currentUser, authLoading]);

  useEffect(() => {
    if (!currentUser || !profile) return;
    const unsub = subscribeToFollows(currentUser.uid, (followingIds) => {
      setIsFollowing(followingIds.includes(profile.uid));
    });
    return () => unsub();
  }, [currentUser, profile]);

  const handleToggleFollow = async () => {
    if (!currentUser || !profile || currentUser.uid === profile.uid) return;
    const res = await toggleFollow(currentUser.uid, profile.uid);
    setIsFollowing(res);
    setFollowersCount((prev) => (res ? prev + 1 : Math.max(0, prev - 1)));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-400">Loading channel profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-3">
        <h2 className="text-lg font-bold text-white">Creator not found</h2>
        <p className="text-xs text-zinc-400">
          The channel @{username} does not exist or has moved.
        </p>
      </div>
    );
  }

  const creatorPosts = posts.filter((p) => p.authorId === profile.uid);
  const longVideos = creatorPosts.filter((p) => p.type === "long_video");
  const shorts = creatorPosts.filter((p) => p.type === "short_video");
  const gifsAndImages = creatorPosts.filter((p) => p.type === "gif" || p.type === "image");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Channel Header Banner */}
      <div className="relative w-full h-44 sm:h-64 rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
        <img
          src={profile.bannerUrl}
          alt="Channel Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Creator Info Bar */}
      <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-[#09090B] shadow-2xl bg-zinc-900"
          />
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-1.5">
              {profile.displayName}
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </h1>
            <p className="text-xs text-zinc-400">@{profile.username}</p>

            <div className="flex items-center gap-4 text-xs text-zinc-300 font-medium pt-1">
              <span>
                <strong className="text-white font-bold">{formatCount(followersCount)}</strong>{" "}
                Followers
              </span>
              <span>
                <strong className="text-white font-bold">{formatCount(profile.followingCount)}</strong>{" "}
                Following
              </span>
              <span>
                <strong className="text-white font-bold">{creatorPosts.length}</strong> Content
              </span>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        {currentUser && currentUser.uid !== profile.uid ? (
          <button
            onClick={handleToggleFollow}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
              isFollowing
                ? "bg-white/10 text-white hover:bg-white/15"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            }`}
          >
            {isFollowing ? "Following" : "Follow Creator"}
          </button>
        ) : null}
      </div>

      {/* Bio Description */}
      {profile.bio && (
        <div className="px-4 sm:px-6 max-w-3xl">
          <p className="text-xs text-zinc-300 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Channel Tabs */}
      <div className="flex border-b border-white/5 gap-2 px-4 sm:px-6">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
            activeTab === "videos"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Film className="w-4 h-4" />
          Videos ({longVideos.length})
        </button>

        <button
          onClick={() => setActiveTab("shorts")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
            activeTab === "shorts"
              ? "border-red-500 text-red-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          Shorts ({shorts.length})
        </button>

        <button
          onClick={() => setActiveTab("gifs")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
            activeTab === "gifs"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          GIFs & Posts ({gifsAndImages.length})
        </button>
      </div>

      {/* Content Grids */}
      <div className="px-4 sm:px-6">
        {activeTab === "videos" && (
          longVideos.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No long-form videos published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {longVideos.map((vid) => (
                <Link
                  key={vid.id}
                  href={`/watch/${vid.id}`}
                  className="group block space-y-2"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5">
                    <img
                      src={vid.thumbnailUrl || vid.mediaUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {vid.duration && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] font-medium text-white">
                        {formatDuration(vid.duration)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-indigo-400 line-clamp-2 transition-colors">
                      {vid.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500">{formatViews(vid.viewsCount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "shorts" && (
          shorts.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No vertical shorts published yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {shorts.map((short) => (
                <Link
                  key={short.id}
                  href="/shorts"
                  className="group block space-y-1.5"
                >
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/5">
                    <img
                      src={short.thumbnailUrl || short.mediaUrl}
                      alt={short.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-600 text-[9px] font-bold text-white">
                      SHORT
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-red-400 line-clamp-2">
                    {short.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500">{formatViews(short.viewsCount)}</p>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "gifs" && (
          gifsAndImages.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No GIFs or photo posts published yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gifsAndImages.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/5 cursor-pointer"
                >
                  <img
                    src={item.mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {item.type === "gif" && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-purple-600 text-[9px] font-bold text-white">
                      GIF
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center p-3 text-center transition-opacity">
                    <p className="text-xs font-semibold text-white line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
