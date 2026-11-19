"use client";

import { X } from "lucide-react";

interface LightboxModalProps {
  mediaUrl: string | null;
  onClose: () => void;
}

export function LightboxModal({ mediaUrl, onClose }: LightboxModalProps) {
  if (!mediaUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10"
      >
        <img
          src={mediaUrl}
          alt="Expanded Media View"
          className="w-full h-full object-contain max-h-[85vh] rounded-2xl"
        />
      </div>
    </div>
  );
}
