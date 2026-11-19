import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, isFirebaseConfigured } from "./config";

export interface UploadProgressCallback {
  (progress: number): void;
}

export async function uploadMediaFile(
  file: File,
  folder: "posts" | "comments" | "chats" | "avatars",
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // If Firebase is configured with a valid storage bucket, use uploadBytesResumable
  if (isFirebaseConfigured && storage) {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(Math.round(percent));
          },
          (error) => {
            console.warn("Storage upload error, falling back to local data URL:", error);
            // Fallback to local data URL
            resolveWithDataUrl(file, onProgress).then(resolve).catch(reject);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(100);
            resolve(downloadUrl);
          }
        );
      });
    } catch (e) {
      console.warn("Direct upload error, falling back to data URL:", e);
    }
  }

  // Resumable simulation with realistic progress animation & base64/Object URL
  return resolveWithDataUrl(file, onProgress);
}

function resolveWithDataUrl(file: File, onProgress?: UploadProgressCallback): Promise<string> {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress?.(100);

        // Convert file to Data URL so animated GIFs and preview images persist & animate!
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          // If reader fails, fallback to object URL
          resolve(URL.createObjectURL(file));
        };
        reader.readAsDataURL(file);
      } else {
        onProgress?.(progress);
      }
    }, 120);
  });
}
