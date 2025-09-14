// src/services/socialService.js
import { db } from "@/config/firebase";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";
  
  /**
   * Firestore structure:
   * spots/{spotId}
   *   - likesCount: number
   *   - commentsCount: number
   *   likes/{userId} : { userId, createdAt }
   *   comments/{commentId} : { userId, text, displayName, photoURL, createdAt }
   */
  
  // ---------- Likes ----------
  export async function hasUserLiked(spotId, userId) {
    const likeRef = doc(db, "spots", spotId, "likes", userId);
    const snap = await getDoc(likeRef);
    return snap.exists();
  }
  
  export async function toggleLike(spotId, userId) {
    const likeRef = doc(db, "spots", spotId, "likes", userId);
    const spotRef = doc(db, "spots", spotId);
  
    // Use a transaction so the counter stays correct under concurrency.
    return runTransaction(db, async (tx) => {
      const likeSnap = await tx.get(likeRef);
      const spotSnap = await tx.get(spotRef);
  
      const currentLikes = spotSnap.exists() ? (spotSnap.data().likesCount || 0) : 0;
  
      if (likeSnap.exists()) {
        // Unlike
        tx.delete(likeRef);
        tx.update(spotRef, {
          likesCount: Math.max(0, currentLikes - 1),
          updatedAt: serverTimestamp(),
        });
        return { liked: false, likesCount: Math.max(0, currentLikes - 1) };
      } else {
        // Like
        tx.set(likeRef, {
          userId,
          createdAt: serverTimestamp(),
        });
        tx.update(spotRef, {
          likesCount: currentLikes + 1,
          updatedAt: serverTimestamp(),
        });
        return { liked: true, likesCount: currentLikes + 1 };
      }
    });
  }
  
  export function listenLikesCount(spotId, callback) {
    const spotRef = doc(db, "spots", spotId);
    return onSnapshot(spotRef, (snap) => {
      callback(snap.exists() ? (snap.data().likesCount || 0) : 0);
    });
  }
  
  // ---------- Comments ----------
  export async function addComment(spotId, { userId, text, displayName, photoURL }) {
    if (!text || !text.trim()) throw new Error("Comment text is required");
  
    const commentsCol = collection(db, "spots", spotId, "comments");
    const spotRef = doc(db, "spots", spotId);
  
    // Let Firestore assign an ID with setDoc(doc(commentsCol)) pattern
    const commentRef = doc(commentsCol);
  
    await runTransaction(db, async (tx) => {
      const spotSnap = await tx.get(spotRef);
      const currentCount = spotSnap.exists() ? (spotSnap.data().commentsCount || 0) : 0;
  
      tx.set(commentRef, {
        id: commentRef.id,
        spotId,
        userId,
        text: text.trim(),
        displayName: displayName || "User",
        photoURL: photoURL || null,
        createdAt: serverTimestamp(),
      });
  
      tx.update(spotRef, {
        commentsCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
    });
  
    return commentRef.id;
  }
  
  export async function deleteComment(spotId, commentId) {
    const spotRef = doc(db, "spots", spotId);
    const commentRef = doc(db, "spots", spotId, "comments", commentId);
  
    await runTransaction(db, async (tx) => {
      const spotSnap = await tx.get(spotRef);
      const currentCount = spotSnap.exists() ? (spotSnap.data().commentsCount || 0) : 0;
  
      tx.delete(commentRef);
      tx.update(spotRef, {
        commentsCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp(),
      });
    });
  }
  
  export function listenComments(spotId, callback) {
    const q = query(
      collection(db, "spots", spotId, "comments"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (qs) => {
      const items = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    });
  }
  