"use client";

import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

interface AutoplayVideoProps {
  src: string;
  poster?: string;
  className?: string;
  aspectRatio?: string;
}

export function AutoplayVideo({ src, poster, className = "", aspectRatio = "16/9" }: AutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className={`relative overflow-hidden bg-black group/video ${className}`} style={{ aspectRatio }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => {
          if (!videoRef.current) return;
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }}
      />

      {/* Mute/Unmute Floating Button */}
      <button
        onClick={toggleSound}
        className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-opacity opacity-0 group-hover/video:opacity-100 z-10"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Paused Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-sm text-white">
            <Play className="w-6 h-6 fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}
