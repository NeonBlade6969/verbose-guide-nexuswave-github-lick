"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Image as ImageIcon,
  Sparkles,
  Users,
  Film,
  Flame,
  X,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { GroupChat, ChatMessage, UserProfile, SharedPostEmbed } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import {
  subscribeToMessages,
  sendMessage,
  subscribeToFollows,
  toggleFollow,
} from "@/lib/firebase/firestore";
import { uploadMediaFile } from "@/lib/firebase/storage";
import { useAuth } from "@/lib/hooks/useAuth";
import { LightboxModal } from "@/components/comments/LightboxModal";

const CHAT_QUICK_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3k1c3pndnp2Z3lydWh6bnY5bzVob3FiaWRocGZmd2Mzb3Z1MDB0NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnY2YnQ3eWg0b3c2a3RkaGtpYThod2F0ZjIxeTVlZDNscWJ2bjBhNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/du3J3cXyzhj75IOgvA/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzdrNnJ4enNrdHNhbDFzMHhpMmR5dnpsbnkyZ3RlcTBzMG5uMXk3eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufdipQqU2lhNA4g/giphy.gif",
];

interface ChatWindowProps {
  chat: GroupChat;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "gif" | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showQuickGifs, setShowQuickGifs] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(chat.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chat.id]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToFollows(currentUser.uid, (ids) => {
      const map: Record<string, boolean> = {};
      ids.forEach((id) => (map[id] = true));
      setFollowingMap(map);
    });
    return () => unsub();
  }, [currentUser]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const isGif = file.type === "image/gif" || file.name.endsWith(".gif");
    setMediaType(isGif ? "gif" : "image");

    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSelectQuickGif = (gif: string) => {
    setMediaPreview(gif);
    setMediaType("gif");
    setMediaFile(null);
    setShowQuickGifs(false);
  };

  const clearAttachment = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentUser) return;
    if (!inputText.trim() && !mediaPreview) return;

    try {
      let finalMediaUrl = mediaPreview;
      if (mediaFile) {
        setUploadProgress(10);
        finalMediaUrl = await uploadMediaFile(
          mediaFile,
          "chats",
          currentUser.uid,
          (p) => setUploadProgress(p)
        );
      }

      await sendMessage(
        chat.id,
        currentUser,
        inputText.trim(),
        finalMediaUrl,
        mediaType
      );

      setInputText("");
      clearAttachment();
      setUploadProgress(null);
    } catch (err) {
      console.error("Send message error:", err);
      setUploadProgress(null);
    }
  };

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUser || currentUser.uid === targetUid) return;
    const res = await toggleFollow(currentUser.uid, targetUid);
    setFollowingMap((prev) => ({ ...prev, [targetUid]: res }));
  };

  const membersList = Object.values(chat.members || {});

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] overflow-hidden relative">
      {/* Chat Top Header */}
      <div className="p-4 border-b border-white/5 bg-[#121216] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {chat.iconUrl ? (
            <img
              src={chat.iconUrl}
              alt={chat.name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              {chat.name}
            </h2>
            <p className="text-xs text-zinc-400">
              {membersList.length} members • Real-time onSnapshot synced
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMembersDrawer(!showMembersDrawer)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showMembersDrawer
              ? "bg-purple-600 text-white border-purple-500"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Messages Stream */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No messages yet in this group. Send a hello or drop a GIF!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = currentUser?.uid === msg.senderId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group ${
                      isOwn ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Link href={`/profile/${msg.sender.username}`}>
                      <img
                        src={msg.sender.avatarUrl}
                        alt={msg.sender.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                      />
                    </Link>

                    <div
                      className={`max-w-[80%] sm:max-w-md space-y-1 ${
                        isOwn ? "items-end text-right" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="font-semibold text-white">
                          {msg.sender.displayName}
                        </span>
                        <span>{formatTimeAgo(msg.createdAt)}</span>
                      </div>

                      {/* Message Content Bubble */}
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed text-left inline-block ${
                          isOwn
                            ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20"
                            : "bg-[#18181E] border border-white/5 text-zinc-200"
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Uploaded GIF or Image */}
                        {msg.mediaUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden cursor-pointer border border-white/10 max-w-[260px]">
                            <img
                              src={msg.mediaUrl}
                              alt="Chat attachment"
                              onClick={() => setLightboxUrl(msg.mediaUrl!)}
                              className="w-full max-h-48 object-cover rounded-xl hover:scale-105 transition-transform"
                            />
                            {msg.mediaType === "gif" && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-purple-600 text-[9px] font-bold text-white">
                                GIF
                              </span>
                            )}
                          </div>
                        )}

                        {/* Shared Post Card Embed */}
                        {msg.sharedPost && (
                          <Link
                            href={
                              msg.sharedPost.type === "short_video"
                                ? "/shorts"
                                : `/watch/${msg.sharedPost.postId}`
                            }
                            className="mt-2 block p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-indigo-400 transition-colors"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2">
                              <img
                                src={msg.sharedPost.thumbnailUrl || msg.sharedPost.mediaUrl}
                                alt={msg.sharedPost.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white uppercase">
                                {msg.sharedPost.type.replace("_", " ")}
                              </div>
                            </div>
                            <p className="text-xs font-bold text-white line-clamp-1">
                              {msg.sharedPost.title}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              By {msg.sharedPost.authorName}
                            </p>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick GIF Reactions Bar */}
          {showQuickGifs && (
            <div className="p-3 bg-zinc-900 border-t border-white/5">
              <p className="text-[11px] font-semibold text-zinc-400 mb-2">
                Click to send GIF:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CHAT_QUICK_GIFS.map((gif, idx) => (
                  <img
                    key={idx}
                    src={gif}
                    alt="Quick GIF"
                    onClick={() => handleSelectQuickGif(gif)}
                    className="w-20 h-16 object-cover rounded-lg border border-white/10 hover:border-purple-400 cursor-pointer"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Media Attachment Preview */}
          {mediaPreview && (
            <div className="px-4 py-2 bg-zinc-900 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={mediaPreview}
                  alt="Attachment Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-white/10"
                />
                <span className="text-xs text-purple-400 font-semibold uppercase">
                  {mediaType} attachment ready to send
                </span>
              </div>
              <button
                onClick={clearAttachment}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-white/5 bg-[#121216]"
          >
            {uploadProgress !== null && (
              <div className="mb-2 w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message #general... (Attach images or animated GIFs)"
                className="flex-1 py-2 px-3.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-400 hover:text-purple-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Attach Image or GIF"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowQuickGifs(!showQuickGifs)}
                className="p-2 text-zinc-400 hover:text-purple-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Reaction GIFs"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() && !mediaPreview}
                className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl disabled:opacity-30 transition-all shadow-md shadow-purple-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Members Drawer */}
        {showMembersDrawer && (
          <div className="w-64 border-l border-white/5 bg-[#121216] p-4 flex flex-col space-y-3 shrink-0 animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Members ({membersList.length})
              </h3>
              <button
                onClick={() => setShowMembersDrawer(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto no-scrollbar flex-1">
              {membersList.map((member) => {
                const isFollowed = followingMap[member.uid] || false;
                return (
                  <div
                    key={member.uid}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <Link
                      href={`/profile/${member.username}`}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white group-hover:text-purple-400 truncate">
                          {member.displayName}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {member.role === "admin" ? "Admin" : "Member"}
                        </p>
                      </div>
                    </Link>

                    {currentUser && currentUser.uid !== member.uid && (
                      <button
                        onClick={() => handleToggleFollow(member.uid)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                          isFollowed
                            ? "bg-white/10 text-zinc-300"
                            : "bg-purple-600 hover:bg-purple-500 text-white"
                        }`}
                      >
                        {isFollowed ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <LightboxModal
        mediaUrl={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
}
