"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  Sparkles,
  X,
  Trash2,
  Reply,
  Heart,
  Smile,
} from "lucide-react";
import { Comment, UserProfile } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import {
  subscribeToComments,
  addComment,
  deleteComment,
} from "@/lib/firebase/firestore";
import { uploadMediaFile } from "@/lib/firebase/storage";
import { useAuth } from "@/lib/hooks/useAuth";
import { LightboxModal } from "./LightboxModal";

// Quick GIF presets for fast reactions
const QUICK_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3k1c3pndnp2Z3lydWh6bnY5bzVob3FiaWRocGZmd2Mzb3Z1MDB0NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnY2YnQ3eWg0b3c2a3RkaGtpYThod2F0ZjIxeTVlZDNscWJ2bjBhNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/du3J3cXyzhj75IOgvA/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzdrNnJ4enNrdHNhbDFzMHhpMmR5dnpsbnkyZ3RlcTBzMG5uMXk3eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufdipQqU2lhNA4g/giphy.gif",
];

interface CommentSectionProps {
  postId: string;
  onClose?: () => void;
}

export function CommentSection({ postId, onClose }: CommentSectionProps) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "gif" | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showQuickGifs, setShowQuickGifs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToComments(postId, (list) => {
      setComments(list);
    });
    return () => unsub();
  }, [postId]);

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

  const handleSelectQuickGif = (gifUrl: string) => {
    setMediaPreview(gifUrl);
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

  const handlePostComment = async (parentId?: string | null) => {
    if (!currentUser) return;
    const content = parentId ? replyText : text;
    if (!content.trim() && !mediaPreview) return;

    try {
      let finalMediaUrl = mediaPreview;
      if (mediaFile) {
        setUploadProgress(10);
        finalMediaUrl = await uploadMediaFile(
          mediaFile,
          "comments",
          currentUser.uid,
          (p) => setUploadProgress(p)
        );
      }

      await addComment(
        postId,
        currentUser,
        content.trim(),
        finalMediaUrl,
        mediaType,
        parentId
      );

      if (parentId) {
        setReplyingToId(null);
        setReplyText("");
      } else {
        setText("");
        clearAttachment();
      }
      setUploadProgress(null);
    } catch (e) {
      console.error("Comment submit error:", e);
      setUploadProgress(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Comments</h3>
          <p className="text-xs text-zinc-400">
            {comments.reduce(
              (acc, c) => acc + 1 + (c.replies?.length || 0),
              0
            )}{" "}
            responses
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {comments.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No comments yet. Be the first to share an image or GIF!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2.5">
              {/* Top-Level Comment */}
              <div className="flex items-start gap-3 group">
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.displayName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {comment.author.displayName}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {comment.content && (
                    <p className="text-xs text-zinc-200 mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}

                  {/* Uploaded Rich Media Image/GIF */}
                  {comment.mediaUrl && (
                    <div className="mt-2 relative inline-block max-w-[280px] rounded-xl overflow-hidden border border-white/10 bg-black cursor-pointer group/media">
                      <img
                        src={comment.mediaUrl}
                        alt="Comment attachment"
                        onClick={() => setLightboxUrl(comment.mediaUrl!)}
                        className="w-full max-h-48 object-cover rounded-xl hover:scale-105 transition-transform"
                      />
                      {comment.mediaType === "gif" && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-purple-600 text-[9px] font-bold text-white">
                          GIF
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions (Reply, Like, Delete) */}
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                    <button
                      onClick={() =>
                        setReplyingToId(
                          replyingToId === comment.id ? null : comment.id
                        )
                      }
                      className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>

                    {currentUser && currentUser.uid === comment.authorId && (
                      <button
                        onClick={() => deleteComment(postId, comment.id)}
                        className="flex items-center gap-1 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Inline Reply Input */}
                  {replyingToId === comment.id && (
                    <div className="mt-2.5 flex items-center gap-2 pl-2 border-l-2 border-indigo-500/40">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to @${comment.author.username}...`}
                        className="flex-1 py-1 px-2.5 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostComment(comment.id);
                        }}
                      />
                      <button
                        onClick={() => handlePostComment(comment.id)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Level Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-11 space-y-2.5 border-l border-white/5 ml-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2.5 group">
                      <img
                        src={reply.author.avatarUrl}
                        alt={reply.author.displayName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {reply.author.displayName}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                          {reply.content}
                        </p>
                        {reply.mediaUrl && (
                          <div className="mt-1.5 relative inline-block max-w-[220px] rounded-lg overflow-hidden border border-white/10 bg-black cursor-pointer">
                            <img
                              src={reply.mediaUrl}
                              alt="Reply attachment"
                              onClick={() => setLightboxUrl(reply.mediaUrl!)}
                              className="w-full max-h-36 object-cover rounded-lg hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        {currentUser && currentUser.uid === reply.authorId && (
                          <button
                            onClick={() =>
                              deleteComment(postId, reply.id, comment.id)
                            }
                            className="mt-1 text-[10px] text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Media Attachment Preview in Input Bar */}
      {mediaPreview && (
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={mediaPreview}
              alt="Attachment Preview"
              className="w-12 h-12 object-cover rounded-lg border border-white/10"
            />
            <div>
              <p className="text-[11px] font-semibold text-indigo-400 uppercase">
                {mediaType} Attachment Ready
              </p>
              <p className="text-[10px] text-zinc-400">
                Will be uploaded inline with your comment
              </p>
            </div>
          </div>
          <button
            onClick={clearAttachment}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick GIF Selector Drawer */}
      {showQuickGifs && (
        <div className="p-3 bg-zinc-900/90 border-t border-white/5">
          <p className="text-[11px] font-semibold text-zinc-400 mb-2">
            Select a reaction GIF:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_GIFS.map((gif, idx) => (
              <img
                key={idx}
                src={gif}
                alt="Quick GIF"
                onClick={() => handleSelectQuickGif(gif)}
                className="w-20 h-16 object-cover rounded-lg border border-white/10 hover:border-purple-400 cursor-pointer transition-colors"
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Comment Input Bar */}
      <div className="p-3 border-t border-white/5 bg-[#09090B]">
        {uploadProgress !== null && (
          <div className="mb-2 w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {currentUser && (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-full object-cover hidden sm:block"
            />
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              currentUser
                ? "Write a comment... (Attach images or GIFs!)"
                : "Sign in to join the conversation"
            }
            disabled={!currentUser}
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePostComment();
            }}
            className="flex-1 py-2 px-3 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Attach Image/GIF Button */}
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
            disabled={!currentUser}
            className="p-2 text-zinc-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors"
            title="Upload Image or animated GIF"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Quick GIF reaction picker */}
          <button
            type="button"
            onClick={() => setShowQuickGifs(!showQuickGifs)}
            disabled={!currentUser}
            className="p-2 text-zinc-400 hover:text-purple-400 rounded-lg hover:bg-white/5 transition-colors"
            title="Select Reaction GIF"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handlePostComment()}
            disabled={!currentUser || (!text.trim() && !mediaPreview)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-30 transition-all shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <LightboxModal
        mediaUrl={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
}
