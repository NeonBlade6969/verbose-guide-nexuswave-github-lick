import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import {
  UserProfile,
  Post,
  Comment,
  GroupChat,
  ChatMessage,
  FollowRelationship,
  MediaType,
  SharedPostEmbed,
} from "@/lib/types";

// Storage keys (for purely ephemeral in-session state if offline)
const STORAGE_KEY_POSTS = "nexuswave_posts";
const STORAGE_KEY_USERS = "nexuswave_users";
const STORAGE_KEY_COMMENTS = "nexuswave_comments";
const STORAGE_KEY_CHATS = "nexuswave_chats";
const STORAGE_KEY_MESSAGES = "nexuswave_messages";
const STORAGE_KEY_FOLLOWS = "nexuswave_follows";

// Clean live defaults - zero dummy accounts or fake posts
const DEFAULT_POSTS: Post[] = [];
const DEFAULT_USERS: UserProfile[] = [];
const DEFAULT_COMMENTS: Record<string, Comment[]> = {};
const DEFAULT_CHATS: GroupChat[] = [];
const DEFAULT_MESSAGES: Record<string, ChatMessage[]> = {};

function getLocalData<T>(key: string, defaultVal: T): T {
  return defaultVal;
}

function setLocalData<T>(key: string, val: T): void {
  // No-op in live production mode
}

// Ensure no seed/demo data is ever written to storage
export function ensureSeedDataInitialized() {
  // Purely real live user data
}

// -------------------------------------------------------------
// POSTS
// -------------------------------------------------------------
export function subscribeToPosts(
  filter: "foryou" | "following" = "foryou",
  currentUserId?: string,
  callback?: (posts: Post[]) => void
): () => void {
  if (typeof window !== "undefined") ensureSeedDataInitialized();

  if (isFirebaseConfigured && db) {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const items: Post[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Post);
      });
      if (filter === "following" && currentUserId) {
        // Filter by following uids
        callback?.(items);
      } else {
        callback?.(items);
      }
    });
  }

  // Local/Seed Fallback Listener
  const update = () => {
    let posts = getLocalData<Post[]>(STORAGE_KEY_POSTS, DEFAULT_POSTS);
    if (filter === "following" && currentUserId) {
      const follows = getLocalData<FollowRelationship[]>(STORAGE_KEY_FOLLOWS, []);
      const followingIds = new Set(
        follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId)
      );
      posts = posts.filter((p) => followingIds.has(p.authorId));
    }
    callback?.(posts);
  };

  update();
  const listener = () => update();
  if (typeof window !== "undefined") {
    window.addEventListener("nexus_store_update", listener);
    window.addEventListener("storage", listener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("nexus_store_update", listener);
      window.removeEventListener("storage", listener);
    }
  };
}

export async function createPost(newPost: Omit<Post, "id" | "viewsCount" | "likesCount" | "commentsCount" | "sharesCount" | "createdAt">): Promise<Post> {
  const post: Post = {
    ...newPost,
    id: "post_" + Date.now(),
    viewsCount: 1,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: Date.now(),
    likedByCurrentUser: false,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "posts", post.id), {
        ...post,
        createdAt: Timestamp.now(),
      });
    } catch (e) {
      console.warn("Firestore write failed, falling back to local:", e);
    }
  }

  const posts = getLocalData<Post[]>(STORAGE_KEY_POSTS, DEFAULT_POSTS);
  setLocalData(STORAGE_KEY_POSTS, [post, ...posts]);
  return post;
}

export async function toggleLikePost(postId: string, userId: string): Promise<boolean> {
  const posts = getLocalData<Post[]>(STORAGE_KEY_POSTS, DEFAULT_POSTS);
  let isLiked = false;
  const updated = posts.map((p) => {
    if (p.id === postId) {
      isLiked = !p.likedByCurrentUser;
      return {
        ...p,
        likedByCurrentUser: isLiked,
        likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
      };
    }
    return p;
  });
  setLocalData(STORAGE_KEY_POSTS, updated);

  if (isFirebaseConfigured && db) {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        likesCount: increment(isLiked ? 1 : -1),
      });
    } catch (e) {
      console.warn("Firebase like update warning:", e);
    }
  }
  return isLiked;
}

// -------------------------------------------------------------
// COMMENTS (With Image/GIF Attachments & 1-Level Nested Replies)
// -------------------------------------------------------------
export function subscribeToComments(
  postId: string,
  callback: (comments: Comment[]) => void
): () => void {
  if (typeof window !== "undefined") ensureSeedDataInitialized();

  if (isFirebaseConfigured && db) {
    const commentsRef = collection(db, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      const allComments: Comment[] = [];
      snapshot.forEach((docSnap) => {
        allComments.push({ id: docSnap.id, ...docSnap.data() } as Comment);
      });
      // Nest replies into parent comments
      const topLevel = allComments.filter((c) => !c.parentId);
      topLevel.forEach((parent) => {
        parent.replies = allComments.filter((c) => c.parentId === parent.id);
      });
      callback(topLevel);
    });
  }

  const update = () => {
    const all = getLocalData<Record<string, Comment[]>>(STORAGE_KEY_COMMENTS, DEFAULT_COMMENTS);
    const postComments = all[postId] || [];
    callback(postComments);
  };

  update();
  const listener = () => update();
  if (typeof window !== "undefined") {
    window.addEventListener("nexus_store_update", listener);
    window.addEventListener("storage", listener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("nexus_store_update", listener);
      window.removeEventListener("storage", listener);
    }
  };
}

export async function addComment(
  postId: string,
  author: UserProfile,
  content: string,
  mediaUrl?: string | null,
  mediaType?: "image" | "gif" | null,
  parentId?: string | null
): Promise<Comment> {
  const newComment: Comment = {
    id: "comment_" + Date.now(),
    postId,
    authorId: author.uid,
    author: {
      uid: author.uid,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
    },
    content,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    parentId: parentId || null,
    likesCount: 0,
    createdAt: Date.now(),
    likedByCurrentUser: false,
    replies: [],
  };

  const allComments = getLocalData<Record<string, Comment[]>>(STORAGE_KEY_COMMENTS, DEFAULT_COMMENTS);
  const currentPostComments = allComments[postId] || [];

  if (parentId) {
    // Add as nested reply
    const updated = currentPostComments.map((c) => {
      if (c.id === parentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newComment],
        };
      }
      return c;
    });
    allComments[postId] = updated;
  } else {
    allComments[postId] = [newComment, ...currentPostComments];
  }

  setLocalData(STORAGE_KEY_COMMENTS, allComments);

  // Increment post commentsCount
  const posts = getLocalData<Post[]>(STORAGE_KEY_POSTS, DEFAULT_POSTS);
  setLocalData(
    STORAGE_KEY_POSTS,
    posts.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
  );

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "posts", postId, "comments", newComment.id), {
        ...newComment,
        createdAt: Timestamp.now(),
      });
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });
    } catch (e) {
      console.warn("Firestore comment write warning:", e);
    }
  }

  return newComment;
}

export async function deleteComment(postId: string, commentId: string, parentId?: string | null): Promise<void> {
  const allComments = getLocalData<Record<string, Comment[]>>(STORAGE_KEY_COMMENTS, DEFAULT_COMMENTS);
  const currentPostComments = allComments[postId] || [];

  if (parentId) {
    allComments[postId] = currentPostComments.map((c) => {
      if (c.id === parentId) {
        return {
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== commentId),
        };
      }
      return c;
    });
  } else {
    allComments[postId] = currentPostComments.filter((c) => c.id !== commentId);
  }

  setLocalData(STORAGE_KEY_COMMENTS, allComments);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(-1),
      });
    } catch (e) {
      console.warn("Firestore delete comment error:", e);
    }
  }
}

// -------------------------------------------------------------
// FOLLOWS & USERS
// -------------------------------------------------------------
export function subscribeToFollows(
  followerId: string,
  callback: (followingIds: string[]) => void
): () => void {
  if (typeof window !== "undefined") ensureSeedDataInitialized();

  const update = () => {
    const follows = getLocalData<FollowRelationship[]>(STORAGE_KEY_FOLLOWS, []);
    const following = follows.filter((f) => f.followerId === followerId).map((f) => f.followingId);
    callback(following);
  };

  update();
  const listener = () => update();
  if (typeof window !== "undefined") {
    window.addEventListener("nexus_store_update", listener);
    window.addEventListener("storage", listener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("nexus_store_update", listener);
      window.removeEventListener("storage", listener);
    }
  };
}

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const follows = getLocalData<FollowRelationship[]>(STORAGE_KEY_FOLLOWS, []);
  const existsIndex = follows.findIndex(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
  let isFollowing = false;

  if (existsIndex >= 0) {
    follows.splice(existsIndex, 1);
    isFollowing = false;
  } else {
    follows.push({ followerId, followingId, createdAt: Date.now() });
    isFollowing = true;
  }
  setLocalData(STORAGE_KEY_FOLLOWS, follows);

  // Update follower & following counters on users
  const users = getLocalData<UserProfile[]>(STORAGE_KEY_USERS, DEFAULT_USERS);
  const updatedUsers = users.map((u) => {
    if (u.uid === followingId) {
      return {
        ...u,
        followersCount: isFollowing ? u.followersCount + 1 : Math.max(0, u.followersCount - 1),
      };
    }
    if (u.uid === followerId) {
      return {
        ...u,
        followingCount: isFollowing ? u.followingCount + 1 : Math.max(0, u.followingCount - 1),
      };
    }
    return u;
  });
  setLocalData(STORAGE_KEY_USERS, updatedUsers);

  if (isFirebaseConfigured && db) {
    try {
      const followDocId = `${followerId}_${followingId}`;
      if (isFollowing) {
        await setDoc(doc(db, "follows", followDocId), {
          followerId,
          followingId,
          createdAt: Timestamp.now(),
        });
        await updateDoc(doc(db, "users", followingId), { followersCount: increment(1) });
        await updateDoc(doc(db, "users", followerId), { followingCount: increment(1) });
      } else {
        await deleteDoc(doc(db, "follows", followDocId));
        await updateDoc(doc(db, "users", followingId), { followersCount: increment(-1) });
        await updateDoc(doc(db, "users", followerId), { followingCount: increment(-1) });
      }
    } catch (e) {
      console.warn("Firestore follow sync warning:", e);
    }
  }

  return isFollowing;
}

export async function fetchUserProfile(usernameOrUid: string): Promise<UserProfile | null> {
  if (!usernameOrUid) return null;

  if (isFirebaseConfigured && db) {
    try {
      // 1. Try fetching by document ID (uid) directly
      const userDocRef = doc(db, "users", usernameOrUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfile;
      }

      const usersRef = collection(db, "users");

      // 2. Try querying by exact username handle
      const qExact = query(usersRef, where("username", "==", usernameOrUid));
      const snapExact = await getDocs(qExact);
      if (!snapExact.empty) {
        return snapExact.docs[0].data() as UserProfile;
      }

      // 3. Try querying by lowercase username handle
      const lower = usernameOrUid.toLowerCase();
      if (lower !== usernameOrUid) {
        const qLower = query(usersRef, where("username", "==", lower));
        const snapLower = await getDocs(qLower);
        if (!snapLower.empty) {
          return snapLower.docs[0].data() as UserProfile;
        }
      }

      // 4. Try querying by uid field
      const qUid = query(usersRef, where("uid", "==", usernameOrUid));
      const snapUid = await getDocs(qUid);
      if (!snapUid.empty) {
        return snapUid.docs[0].data() as UserProfile;
      }
    } catch (e) {
      console.warn("Could not fetch user from Firestore:", e);
    }
  }

  // Fallback to active localStorage user (for instant load or if firestore rules are locked)
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("nexuswave_auth_user");
      if (saved) {
        const u = JSON.parse(saved) as UserProfile;
        if (
          u.uid === usernameOrUid ||
          u.username.toLowerCase() === usernameOrUid.toLowerCase()
        ) {
          return u;
        }
      }
    } catch {}
  }

  return null;
}

export function getUserProfile(usernameOrUid: string): UserProfile | null {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("nexuswave_auth_user");
      if (saved) {
        const u = JSON.parse(saved) as UserProfile;
        if (
          u.uid === usernameOrUid ||
          u.username.toLowerCase() === usernameOrUid.toLowerCase()
        ) {
          return u;
        }
      }
    } catch {}
  }
  return null;
}

export function subscribeToCreators(
  callback: (creators: UserProfile[]) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const usersRef = collection(db, "users");
    return onSnapshot(
      usersRef,
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as UserProfile);
        });
        users.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
        callback(users);
      },
      (err) => {
        console.warn("Could not subscribe to creators:", err);
        callback([]);
      }
    );
  }

  callback([]);
  return () => {};
}

export function getAllUsers(): UserProfile[] {
  return [];
}

// -------------------------------------------------------------
// GROUP CHATS & REAL-TIME MESSAGING
// -------------------------------------------------------------
export function subscribeToGroupChats(
  userId: string,
  callback: (chats: GroupChat[]) => void
): () => void {
  if (typeof window !== "undefined") ensureSeedDataInitialized();

  if (isFirebaseConfigured && db) {
    const chatsRef = collection(db, "chats");
    // Querying with array-contains without orderBy avoids requiring a composite index in Firestore!
    const q = query(chatsRef, where("memberIds", "array-contains", userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: GroupChat[] = [];
        snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as GroupChat));
        items.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
        callback(items);
      },
      (error) => {
        console.warn("Firestore chats listener error:", error);
      }
    );
  }

  const update = () => {
    const chats = getLocalData<GroupChat[]>(STORAGE_KEY_CHATS, DEFAULT_CHATS);
    const userChats = chats.filter((c) => c.memberIds.includes(userId) || c.memberIds.length === 0);
    callback(userChats);
  };

  update();
  const listener = () => update();
  if (typeof window !== "undefined") {
    window.addEventListener("nexus_store_update", listener);
    window.addEventListener("storage", listener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("nexus_store_update", listener);
      window.removeEventListener("storage", listener);
    }
  };
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  if (typeof window !== "undefined") ensureSeedDataInitialized();

  if (isFirebaseConfigured && db) {
    const msgRef = collection(db, "chats", chatId, "messages");
    const q = query(msgRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => msgs.push({ id: d.id, ...d.data() } as ChatMessage));
      callback(msgs);
    });
  }

  const update = () => {
    const all = getLocalData<Record<string, ChatMessage[]>>(STORAGE_KEY_MESSAGES, DEFAULT_MESSAGES);
    callback(all[chatId] || []);
  };

  update();
  const listener = () => update();
  if (typeof window !== "undefined") {
    window.addEventListener("nexus_store_update", listener);
    window.addEventListener("storage", listener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("nexus_store_update", listener);
      window.removeEventListener("storage", listener);
    }
  };
}

export async function sendMessage(
  chatId: string,
  sender: UserProfile,
  content: string,
  mediaUrl?: string | null,
  mediaType?: "image" | "gif" | null,
  sharedPost?: SharedPostEmbed | null
): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: "msg_" + Date.now(),
    chatId,
    senderId: sender.uid,
    sender: {
      uid: sender.uid,
      username: sender.username,
      displayName: sender.displayName,
      avatarUrl: sender.avatarUrl,
    },
    content,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    sharedPost: sharedPost || null,
    readBy: [sender.uid],
    createdAt: Date.now(),
  };

  // Update local messages store
  const allMsgs = getLocalData<Record<string, ChatMessage[]>>(STORAGE_KEY_MESSAGES, DEFAULT_MESSAGES);
  const currentChatMsgs = allMsgs[chatId] || [];
  allMsgs[chatId] = [...currentChatMsgs, newMsg];
  setLocalData(STORAGE_KEY_MESSAGES, allMsgs);

  // Update chat lastMessage
  const chats = getLocalData<GroupChat[]>(STORAGE_KEY_CHATS, DEFAULT_CHATS);
  const updatedChats = chats.map((c) => {
    if (c.id === chatId) {
      return {
        ...c,
        lastMessage: {
          content: content || (mediaType ? `Attached ${mediaType}` : "Shared a post"),
          senderId: sender.uid,
          senderName: sender.displayName,
          mediaType: mediaType || (sharedPost ? "post" : null),
          createdAt: Date.now(),
        },
        lastMessageAt: Date.now(),
      };
    }
    return c;
  });
  setLocalData(STORAGE_KEY_CHATS, updatedChats);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "chats", chatId, "messages", newMsg.id), {
        ...newMsg,
        createdAt: Timestamp.now(),
      });
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: newMsg,
        lastMessageAt: Timestamp.now(),
      });
    } catch (e) {
      console.warn("Firestore send message warning:", e);
    }
  }

  return newMsg;
}

export async function createGroupChat(
  creator: UserProfile,
  name: string,
  iconUrl: string | null,
  invitedUsers: UserProfile[]
): Promise<GroupChat> {
  const allMembers = [creator, ...invitedUsers];
  const membersMap: GroupChat["members"] = {};
  allMembers.forEach((u) => {
    membersMap[u.uid] = {
      uid: u.uid,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.uid === creator.uid ? "admin" : "member",
      joinedAt: Date.now(),
    };
  });

  const newChat: GroupChat = {
    id: "chat_" + Date.now(),
    name,
    iconUrl: iconUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
    creatorId: creator.uid,
    adminIds: [creator.uid],
    memberIds: allMembers.map((u) => u.uid),
    members: membersMap,
    lastMessage: null,
    lastMessageAt: Date.now(),
    createdAt: Date.now(),
    unreadCount: 0,
  };

  const chats = getLocalData<GroupChat[]>(STORAGE_KEY_CHATS, DEFAULT_CHATS);
  setLocalData(STORAGE_KEY_CHATS, [newChat, ...chats]);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "chats", newChat.id), {
        ...newChat,
        createdAt: Timestamp.now(),
        lastMessageAt: Timestamp.now(),
      });
    } catch (e) {
      console.warn("Firestore create group chat warning:", e);
    }
  }

  return newChat;
}
