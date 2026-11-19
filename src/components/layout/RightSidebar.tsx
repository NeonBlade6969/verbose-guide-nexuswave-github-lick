"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Users, Sparkles, ChevronRight, Hash } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChat } from "@/lib/hooks/useChat";
import { subscribeToCreators } from "@/lib/firebase/firestore";
import { UserProfile } from "@/lib/types";

export function RightSidebar() {
  const { currentUser } = useAuth();
  const { chats } = useChat(currentUser?.uid);
  const [creators, setCreators] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = subscribeToCreators((list) => {
      const filtered = list.filter((u) => u.uid !== currentUser?.uid).slice(0, 4);
      setCreators(filtered);
    });
    return () => unsub();
  }, [currentUser]);

  return (
    <aside className="w-80 hidden xl:flex flex-col h-[calc(100vh-57px)] sticky top-[57px] p-4 border-l border-white/5 bg-[#09090B] space-y-6 select-none overflow-y-auto no-scrollbar">
      {/* Active Group Chats Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Active Group Chats
            </h3>
          </div>
          <Link
            href="/chats"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center font-medium"
          >
            All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-1.5">
          {chats.length === 0 ? (
            <p className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-500">
              No active group chats yet
            </p>
          ) : (
            chats.slice(0, 4).map((chat) => (
              <Link
                key={chat.id}
                href={`/chats/${chat.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 transition-all group"
              >
                <div className="relative">
                  {chat.iconUrl ? (
                    <img
                      src={chat.iconUrl}
                      alt={chat.name}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                      <Hash className="w-4 h-4" />
                    </div>
                  )}
                  {chat.unreadCount ? (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-md">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                    {chat.name}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {chat.lastMessage
                      ? `${chat.lastMessage.senderName.split(" ")[0]}: ${chat.lastMessage.content}`
                      : `${chat.memberIds.length} members`}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Suggested Follows Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Trending Creators
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {creators.length === 0 ? (
            <p className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-500">
              No other creators yet
            </p>
          ) : (
            creators.map((creator) => (
              <div
                key={creator.uid}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <Link
                  href={`/profile/${creator.username}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-indigo-400 transition-all"
                  />
                  <div className="truncate">
                    <p className="text-xs font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                      {creator.displayName}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {creator.followersCount > 1000 ? `${(creator.followersCount / 1000).toFixed(1)}k followers` : `${creator.followersCount} followers`}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/profile/${creator.username}`}
                  className="ml-2 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-medium transition-all"
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
