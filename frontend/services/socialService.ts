// services/socialService.ts
import { db } from "@/config/firebase";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
  
  export const socialService = {
    // users/{uid}/likes/{spotId}
    userLikeRef: (uid: string, spotId: string) =>
      doc(db, "users", uid, "likes", spotId),
  
    // spots/{spotId}
    spotRef: (spotId: string) => doc(db, "spots", spotId),
  
    /** Toggle like atomically.
     * - Creates/deletes users/{uid}/likes/{spotId}
     * - Increments/decrements spots/{spotId}.likesCount (default 0)
     * - Maintains spots/{spotId}.likers (string[] of userIds) for easy “has liked” checks (optional)
     */
    async toggleLike(spotId: string, uid: string) {
      const likeRef = this.userLikeRef(uid, spotId);
      const spotRef = this.spotRef(spotId);
  
      await runTransaction(db, async (tx) => {
        const [likeSnap, spotSnap] = await Promise.all([
          tx.get(likeRef),
          tx.get(spotRef),
        ]);
        const spotExists = spotSnap.exists();
        if (!spotExists) throw new Error("Spot does not exist");
  
        const currentlyLiked = likeSnap.exists();
  
        if (currentlyLiked) {
          // Unlike
          tx.delete(likeRef);
          tx.update(spotRef, {
            likesCount: increment(-1),
            likers: arrayRemove(uid),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Like
          tx.set(likeRef, {
            spotId,
            userId: uid,
            createdAt: serverTimestamp(),
          });
          tx.update(spotRef, {
            likesCount: increment(1),
            likers: arrayUnion(uid),
            updatedAt: serverTimestamp(),
          });
        }
      });
    },
  
    /** Check if this user has liked the spot */
    async hasUserLiked(spotId: string, uid: string): Promise<boolean> {
      const snap = await getDoc(this.userLikeRef(uid, spotId));
      return snap.exists();
    },
  };
  