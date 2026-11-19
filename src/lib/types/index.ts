export type MediaType = 'long_video' | 'short_video' | 'gif' | 'image';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    uid: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  type: MediaType;
  title: string;
  description: string;
  tags: string[];
  mediaUrl: string;
  thumbnailUrl?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | 'auto';
  duration?: number; // In seconds
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: number;
  likedByCurrentUser?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    uid: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'gif' | null;
  parentId?: string | null; // For 1-level nested replies
  likesCount: number;
  createdAt: number;
  likedByCurrentUser?: boolean;
  replies?: Comment[];
}

export interface GroupMember {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface GroupChat {
  id: string;
  name: string;
  iconUrl?: string | null;
  creatorId: string;
  adminIds: string[];
  memberIds: string[];
  members: Record<string, GroupMember>;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    mediaType?: 'image' | 'gif' | 'post' | null;
    createdAt: number;
  } | null;
  lastMessageAt: number;
  createdAt: number;
  unreadCount?: number;
}

export interface SharedPostEmbed {
  postId: string;
  title: string;
  type: MediaType;
  thumbnailUrl?: string;
  mediaUrl: string;
  authorName: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  sender: {
    uid: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'gif' | null;
  sharedPost?: SharedPostEmbed | null;
  readBy: string[];
  createdAt: number;
}

export interface FollowRelationship {
  followerId: string;
  followingId: string;
  createdAt: number;
}
