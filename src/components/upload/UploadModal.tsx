"use client";

import { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  Film,
  Flame,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import { MediaType, Post } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { uploadMediaFile } from "@/lib/firebase/storage";
import { createPost } from "@/lib/firebase/firestore";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
}

export function UploadModal({ isOpen, onClose, onPostCreated }: UploadModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<MediaType>("long_video");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["creative", "nexuswave"]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError(null);

    const isGif = file.type === "image/gif" || file.name.endsWith(".gif");
    if (activeTab === "gif" || isGif) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please sign in to publish content");
      return;
    }
    if (!title.trim()) {
      setError("Please give your post a title");
      return;
    }
    if (!selectedFile && !previewUrl) {
      setError("Please select a video, image, or GIF file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(5);

      // 1. Upload Media File with progress callback
      let mediaDownloadUrl = previewUrl || "";
      if (selectedFile) {
        mediaDownloadUrl = await uploadMediaFile(
          selectedFile,
          "posts",
          currentUser.uid,
          (progress) => setUploadProgress(progress)
        );
      }

      // 2. Upload Thumbnail if long video
      let thumbUrl = thumbnailPreview || "";
      if (thumbnailFile) {
        thumbUrl = await uploadMediaFile(
          thumbnailFile,
          "posts",
          currentUser.uid
        );
      } else if (activeTab === "long_video" && !thumbUrl) {
        thumbUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&auto=format&fit=crop&q=80";
      }

      // 3. Create Firestore Post document
      const newPost = await createPost({
        authorId: currentUser.uid,
        author: {
          uid: currentUser.uid,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
        },
        type: activeTab,
        title: title.trim(),
        description: description.trim(),
        tags,
        mediaUrl: mediaDownloadUrl,
        thumbnailUrl: thumbUrl || undefined,
        aspectRatio: activeTab === "short_video" ? "9:16" : activeTab === "gif" ? "1:1" : "16:9",
        duration: activeTab === "long_video" ? 180 : activeTab === "short_video" ? 30 : undefined,
      });

      onPostCreated?.(newPost);
      onClose();
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err?.message || "Failed to publish post. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-modal rounded-2xl shadow-2xl border border-white/10 text-white max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Publish to NexusWave</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Switcher Tabs */}
        <div className="flex p-2 bg-white/[0.02] border-b border-white/5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("long_video")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "long_video"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Film className="w-4 h-4" />
            Long-Form Video (16:9)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("short_video")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "short_video"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="w-4 h-4" />
            Vertical Short (9:16)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gif")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "gif"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Animated GIF / Image
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Media Dropzone & Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all flex flex-col items-center justify-center text-center p-6 ${
              previewUrl
                ? "border-indigo-500/50 bg-black/40"
                : "border-white/10 hover:border-indigo-400/50 bg-zinc-900/40"
            }`}
            style={{
              minHeight: activeTab === "short_video" ? "240px" : "180px",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaFileChange}
              accept={
                activeTab === "gif"
                  ? "image/gif, image/png, image/jpeg, image/webp"
                  : "video/mp4, video/webm, video/quicktime"
              }
              className="hidden"
            />

            {previewUrl ? (
              activeTab === "gif" ? (
                <img
                  src={previewUrl}
                  alt="GIF Preview"
                  className="max-h-56 rounded-xl object-contain"
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-60 rounded-xl object-contain"
                />
              )
            ) : (
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-indigo-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Click to select{" "}
                  {activeTab === "long_video"
                    ? "MP4 / WebM video"
                    : activeTab === "short_video"
                    ? "Vertical 9:16 clip"
                    : "Animated .GIF or Image"}
                </p>
                <p className="text-xs text-zinc-500">
                  Drag and drop files up to 200MB. Real-time resumable upload.
                </p>
              </div>
            )}
          </div>

          {/* Paste Direct URL Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-400">
                Or paste direct video/image/GIF URL (free, no upload needed):
              </label>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  Clear preview
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder="https://example.com/video.mp4 or https://media.giphy.com/.../giphy.gif"
              value={previewUrl && !selectedFile ? previewUrl : ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                setSelectedFile(null);
                setPreviewUrl(val || null);
              }}
              className="w-full px-3.5 py-2 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neo-Tokyo Night Run in 4K HDR"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what your video or GIF is about..."
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Custom Thumbnail for Long-Form Videos */}
          {activeTab === "long_video" && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Custom Thumbnail (16:9)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  Choose Thumbnail
                </button>
                <input
                  type="file"
                  ref={thumbInputRef}
                  onChange={handleThumbnailChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Custom thumbnail"
                    className="w-16 h-9 object-cover rounded-md border border-white/10"
                  />
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Tags (press Enter or comma)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-900 border border-white/10 rounded-xl min-h-[42px] items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 text-xs flex items-center gap-1 border border-indigo-500/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "gaming, lofi, blender..." : ""}
                className="flex-1 min-w-[100px] bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Real-Time Upload Progress Indicator */}
          {isUploading && uploadProgress !== null && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 animate-bounce" />
                  Uploading & processing media...
                </span>
                <span className="font-bold text-white">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isUploading ? "Publishing..." : "Publish Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
