"use client";

import { useEffect, useState } from "react";
import { Post } from "@/lib/types";
import { subscribeToPosts, toggleLikePost } from "@/lib/firebase/firestore";

export function usePosts(filter: "foryou" | "following" = "foryou", currentUserId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPosts(filter, currentUserId, (fetched) => {
      setPosts(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [filter, currentUserId]);

  const handleLike = async (postId: string) => {
    if (!currentUserId) return;
    await toggleLikePost(postId, currentUserId);
  };

  return { posts, loading, handleLike };
}
