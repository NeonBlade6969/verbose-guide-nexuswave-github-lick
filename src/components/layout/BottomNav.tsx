"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, PlusCircle, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface BottomNavProps {
  onOpenUpload: () => void;
}

export function BottomNav({ onOpenUpload }: BottomNavProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-header border-t border-white/10 px-4 py-2 flex items-center justify-around">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/" ? "text-indigo-400 font-semibold" : "text-zinc-400"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </Link>

      <Link
        href="/shorts"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/shorts" ? "text-indigo-400 font-semibold" : "text-zinc-400"
        }`}
      >
        <Flame className="w-5 h-5" />
        <span className="text-[10px]">Shorts</span>
      </Link>

      <button
        onClick={onOpenUpload}
        className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <Link
        href="/chats"
        className={`flex flex-col items-center gap-1 ${
          pathname?.startsWith("/chats") ? "text-indigo-400 font-semibold" : "text-zinc-400"
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px]">Chats</span>
      </Link>

      <Link
        href={currentUser ? `/profile/${currentUser.username}` : "/"}
        className={`flex flex-col items-center gap-1 ${
          pathname?.startsWith("/profile") ? "text-indigo-400 font-semibold" : "text-zinc-400"
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </Link>
    </nav>
  );
}
