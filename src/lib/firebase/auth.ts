import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./config";
import { UserProfile } from "@/lib/types";

const LOCAL_AUTH_USER_KEY = "nexuswave_auth_user";

// Clean up any legacy demo / seed data from user's local storage
export function purgeLegacyDemoData(): void {
  if (typeof window === "undefined") return;
  const legacyKeys = [
    "nexuswave_posts",
    "nexuswave_users",
    "nexuswave_comments",
    "nexuswave_chats",
    "nexuswave_messages",
    "nexuswave_follows",
  ];
  legacyKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

if (typeof window !== "undefined") {
  purgeLegacyDemoData();
}

export function getInitialAuthUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(LOCAL_AUTH_USER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export function subscribeToAuthState(
  callback: (user: UserProfile | null) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null);
        return;
      }

      const cleanHandle = (fbUser.displayName || fbUser.email?.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 20);
      const uniqueUsername = (cleanHandle + "_" + fbUser.uid.slice(0, 4)).toLowerCase();

      const fallbackProfile: UserProfile = {
        uid: fbUser.uid,
        username: uniqueUsername,
        displayName: fbUser.displayName || "Nexus Creator",
        email: fbUser.email || "",
        avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
        bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
        bio: "Digital creator on NexusWave 🌊",
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Fetch or auto-create profile in Firestore
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(data));
            callback(data);
            return;
          } else {
            try {
              await setDoc(doc(db, "users", fbUser.uid), {
                ...fallbackProfile,
                createdAt: Timestamp.now(),
              });
            } catch (writeErr) {
              console.warn("Could not write user doc to Firestore:", writeErr);
            }
            localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(fallbackProfile));
            callback(fallbackProfile);
            return;
          }
        } catch (e) {
          console.warn("Could not sync user doc with Firestore:", e);
        }
      }

      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(fallbackProfile));
      callback(fallbackProfile);
    });
  }

  const update = () => {
    const user = getInitialAuthUser();
    callback(user);
  };
  update();
  const listener = () => update();
  window.addEventListener("nexus_auth_update", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("nexus_auth_update", listener);
    window.removeEventListener("storage", listener);
  };
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (isFirebaseConfigured && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (db) {
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const user = snap.data() as UserProfile;
        localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(user));
        return user;
      }
    }
  }
  throw new Error("Invalid email or password");
}

export async function registerWithEmail(
  email: string,
  pass: string,
  username: string,
  displayName: string
): Promise<UserProfile> {
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 25);
  const profile: UserProfile = {
    uid: "user_" + Date.now(),
    username: cleanUsername,
    displayName: displayName || username,
    email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    bio: "New creator exploring NexusWave! 🚀",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    profile.uid = cred.user.uid;
    if (db) {
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          ...profile,
          createdAt: Timestamp.now(),
        });
      } catch (e) {
        console.warn("Could not save profile to Firestore:", e);
      }
    }
  }

  localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("nexus_auth_update"));
  return profile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (!auth) throw new Error("Firebase Auth not initialized");
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const fbUser = cred.user;

  // Check if user already exists in Firestore
  if (db) {
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      if (snap.exists()) {
        const existing = snap.data() as UserProfile;
        localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent("nexus_auth_update"));
        return existing;
      }
    } catch (e) {
      console.warn("Could not check existing user:", e);
    }
  }

  const cleanHandle = (fbUser.displayName || fbUser.email?.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 20);
  const uniqueUsername = (cleanHandle + "_" + fbUser.uid.slice(0, 4)).toLowerCase();

  const profile: UserProfile = {
    uid: fbUser.uid,
    username: uniqueUsername,
    displayName: fbUser.displayName || "Google Creator",
    email: fbUser.email || "",
    avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    bio: "Digital creator on NexusWave ⚡",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (db) {
    try {
      await setDoc(doc(db, "users", fbUser.uid), {
        ...profile,
        createdAt: Timestamp.now(),
      });
    } catch (e) {
      console.warn("Could not save profile to Firestore:", e);
    }
  }

  localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("nexus_auth_update"));
  return profile;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch {}
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    window.dispatchEvent(new CustomEvent("nexus_auth_update"));
  }
}
