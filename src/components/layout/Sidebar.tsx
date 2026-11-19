"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToCreators } from "@/lib/firebase/firestore";
import { UserProfile } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [creators, setCreators] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = subscribeToCreators((list) => {
      setCreators(list.slice(0, 5));
    });
    return () => unsub();
  }, []);

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Shorts", href: "/shorts", icon: Flame, badge: "HOT" },
    { label: "Group Chats", href: "/chats", icon: MessageSquare },
    {
      label: "My Channel",
      href: currentUser ? `/profile/${currentUser.username}` : "/",
      icon: User,
    },
  ];

  return (
    <aside className="w-64 hidden lg:flex flex-col h-[calc(100vh-57px)] sticky top-[57px] p-3 border-r border-white/5 bg-[#09090B] select-none">
      {/* Primary Navigation */}
      <div className="space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-400"}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-sm">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="my-4 border-t border-white/5" />

      {/* Suggested Creators Quick List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <p className="px-3.5 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Top Creators
        </p>
        <div className="space-y-1 mt-1">
          {creators.length === 0 ? (
            <p className="px-3.5 py-2 text-xs text-zinc-500">No creators registered yet</p>
          ) : (
            creators.map((user) => (
              <Link
                key={user.uid}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors group"
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-indigo-500 transition-all"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">@{user.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 text-[11px] text-zinc-600 px-3.5">
        <p>© 2026 NexusWave Inc.</p>
        <p className="text-zinc-500">YouTube + Instagram + Discord Hybrid</p>
      </div>
    </aside>
  );
}
