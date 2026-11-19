"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, Bell, Sparkles, LogOut, User, Users } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

interface TopHeaderProps {
  onOpenUpload: () => void;
}

export function TopHeader({ onOpenUpload }: TopHeaderProps) {
  const { currentUser, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-header px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-indigo-400 bg-clip-text text-transparent hidden sm:inline-block">
              NexusWave
            </span>
          </Link>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, creators, GIFs, and topics..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/90 border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full text-sm font-medium shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          <Link
            href="/chats"
            className="p-2 text-zinc-300 hover:text-white rounded-full hover:bg-white/5 relative transition-colors"
            title="Group Chats"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          </Link>

          {/* User Account / Login */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 rounded-full border border-white/10 hover:border-indigo-500/50 transition-colors"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 p-2 glass-modal rounded-2xl shadow-2xl border border-white/10 z-50">
                  <div className="p-3 border-b border-white/5">
                    <p className="font-semibold text-sm text-white truncate">
                      {currentUser.displayName}
                    </p>
                    <p className="text-xs text-zinc-400">@{currentUser.username}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href={`/profile/${currentUser.username}`}
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      View Channel Profile
                    </Link>

                    <Link
                      href="/chats"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4 text-purple-400" />
                      Group Chats
                    </Link>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-full text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
