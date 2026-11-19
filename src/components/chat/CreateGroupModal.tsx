"use client";

import { useState, useEffect } from "react";
import { X, Users, Check, Sparkles } from "lucide-react";
import { UserProfile, GroupChat } from "@/lib/types";
import { subscribeToCreators, createGroupChat } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (chat: GroupChat) => void;
}

export function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCreators((list) => {
      setCreators(list);
    });
    return () => unsub();
  }, []);

  if (!isOpen || !currentUser) return null;

  const toggleSelect = (uid: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      const invited = creators.filter((u) => selectedUserIds.includes(u.uid));
      const chat = await createGroupChat(currentUser, groupName.trim(), null, invited);
      onCreated(chat);
      onClose();
    } catch (err) {
      console.error("Create group error:", err);
    } finally {
      setLoading(false);
    }
  };

  const potentialMembers = creators.filter((u) => u.uid !== currentUser.uid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 glass-modal rounded-2xl shadow-2xl border border-white/10 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">New Group Chat</h2>
            <p className="text-xs text-zinc-400">Collaborate with fellow creators</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Next-Gen Creators Circle 🚀"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Invite Members ({selectedUserIds.length} selected)
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {potentialMembers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No other creators registered yet. You can still create the group!
                </p>
              ) : (
                potentialMembers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.uid);
                  return (
                    <div
                      key={user.uid}
                      onClick={() => toggleSelect(user.uid)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-600/20 border border-purple-500/40"
                          : "bg-white/[0.02] hover:bg-white/[0.06] border border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {user.displayName}
                          </p>
                          <p className="text-[10px] text-zinc-400">@{user.username}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "border-white/20"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim()}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
