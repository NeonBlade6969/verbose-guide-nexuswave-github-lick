"use client";

import { useEffect, useState } from "react";
import { GroupChat, ChatMessage } from "@/lib/types";
import {
  subscribeToGroupChats,
  subscribeToMessages,
  sendMessage,
} from "@/lib/firebase/firestore";

export function useChat(userId?: string, activeChatId?: string) {
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToGroupChats(userId, (list) => {
      setChats(list);
      setLoadingChats(false);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const unsub = subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });
    return () => unsub();
  }, [activeChatId]);

  return {
    chats,
    messages,
    loadingChats,
    loadingMessages,
  };
}
