"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/types";
import { subscribeToAuthState, logoutUser } from "@/lib/firebase/auth";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    currentUser,
    loading,
    logout: logoutUser,
  };
}
