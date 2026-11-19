"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChat } from "@/lib/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { GroupChat } from "@/lib/types";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default function SingleChatPage({ params }: ChatPageProps) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;
  const { currentUser } = useAuth();
  const { chats, loadingChats } = useChat(currentUser?.uid);

  const activeChat = chats.find((c) => c.id === chatId);

  if (loadingChats) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500">Connecting to real-time chat stream...</p>
      </div>
    );
  }

  if (!activeChat) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 px-4">
        <h2 className="text-base font-bold text-white">Chat room not found</h2>
        <p className="text-xs text-zinc-400">
          You may not be a member of this chat or it may have been closed.
        </p>
        <Link
          href="/chats"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chats Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] w-full flex flex-col">
      <ChatWindow chat={activeChat} />
    </div>
  );
}
