import { UserProfile, Post, Comment, GroupChat, ChatMessage } from "@/lib/types";

// Clean production mode: No fake accounts, no fake posts, no dummy data
export const SEED_USERS: UserProfile[] = [];
export const SEED_POSTS: Post[] = [];
export const SEED_COMMENTS: Record<string, Comment[]> = {};
export const SEED_GROUP_CHATS: GroupChat[] = [];
export const SEED_MESSAGES: Record<string, ChatMessage[]> = {};
