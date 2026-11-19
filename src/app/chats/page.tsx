"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Users, Hash, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChat } from "@/lib/hooks/useChat";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { formatTimeAgo } from "@/lib/utils";

export default function ChatsHubPage() {
  const { currentUser } = useAuth();
  const { chats, loadingChats } = useChat(currentUser?.uid);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-400" />
            Group Chats Hub
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time messaging with creators, fans, and community channels
          </p>
        </div>

        {currentUser && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Group
          </button>
        )}
      </div>

      {/* Chats List */}
      {loadingChats ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Syncing active group chats...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121216] border border-white/5 p-8 space-y-3">
          <Users className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No group chats yet</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Create a group chat to share videos, collaborate, and chat in real-time with creators!
          </p>
          {currentUser && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
            >
              Start First Group
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chats/${chat.id}`}
              className="p-4 rounded-2xl bg-[#121216] hover:bg-white/[0.04] border border-white/5 hover:border-purple-500/30 transition-all flex items-start gap-4 group shadow-md"
            >
              {chat.iconUrl ? (
                <img
                  src={chat.iconUrl}
                  alt={chat.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                  <Hash className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    {chat.name}
                  </h3>
                  {chat.lastMessage && (
                    <span className="text-[10px] text-zinc-500 shrink-0 ml-2">
                      {formatTimeAgo(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                  {chat.lastMessage
                    ? `${chat.lastMessage.senderName.split(" ")[0]}: ${chat.lastMessage.content}`
                    : `${chat.memberIds.length} members`}
                </p>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    {chat.memberIds.length} members
                  </span>
                  <span className="text-indigo-400 flex items-center gap-0.5 font-medium ml-auto group-hover:translate-x-1 transition-transform">
                    Open <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Group Creation Dialog */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newChat) => {
          window.location.href = `/chats/${newChat.id}`;
        }}
      />
    </div>
  );
}
