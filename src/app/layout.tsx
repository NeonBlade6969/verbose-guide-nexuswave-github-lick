"use client";

import { useState } from "react";
import "./globals.css";
import { TopHeader } from "@/components/layout/TopHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { UploadModal } from "@/components/upload/UploadModal";
import { Post } from "@/lib/types";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <html lang="en" className="dark">
      <head>
        <title>NexusWave — Next-Gen Social Video & Community</title>
        <meta
          name="description"
          content="Full-stack social media and video sharing platform featuring YouTube long-form, Instagram vertical shorts & GIFs, rich media comments, and Discord real-time group chats."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-[#09090B] text-white min-h-screen flex flex-col antialiased">
        {/* Sticky Top Header */}
        <TopHeader onOpenUpload={() => setIsUploadOpen(true)} />

        <div className="flex-1 flex max-w-[1920px] mx-auto w-full">
          {/* Desktop Left Nav Sidebar */}
          <Sidebar />

          {/* Center Dynamic Stream View */}
          <main className="flex-1 min-w-0 pb-16 lg:pb-0">
            {children}
          </main>

          {/* Desktop Right Group Chats & Suggested Sidebar */}
          <RightSidebar />
        </div>

        {/* Mobile Touch Navigation */}
        <BottomNav onOpenUpload={() => setIsUploadOpen(true)} />

        {/* Global Unified Upload Modal */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onPostCreated={(post: Post) => {
            console.log("Post published:", post.id);
          }}
        />
      </body>
    </html>
  );
}
