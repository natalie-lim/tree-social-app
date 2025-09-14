import { getRatingColor } from "@/utils/ratingColors";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { rankingsService } from "../services/firestore";
import { ThemedText } from "./themed-text";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

export interface SpotPhoto {
  caption: string;
  credit: string;
  url: string;
}

export interface SpotLocation {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Spot {
  id: string;
  name: string;
  description: string;
  category: string;
  location: SpotLocation;
  photos: SpotPhoto[];
  amenities: string[];
  averageRating: number;
  reviewCount: number; // comments count
  totalRatings: number; // likes count
  bestTimeToVisit: string[];
  difficulty: string;
  distance: string;
  duration: string;
  elevation: string;
  isVerified: boolean;
  npsCode?: string;
  website?: string;
  tags: string[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  source: string;
}

interface SpotCardProps {
  spot: Spot;
  onPress?: (spot: Spot) => void;
  style?: any;
  rankingUserId?: string;
  userName?: string;
  userDisplayName?: string;
  userNotes?: string;
  userRating?: number;
}

type SpotComment = {
  id: string;
  text: string;
  userId: string;
  displayName?: string;
  createdAt?: any;
};

const { width } = Dimensions.get("window");

export function SpotCard({
  spot,
  onPress,
  style,
  rankingUserId,
  userName,
  userDisplayName,
  userNotes,
  userRating,
}: SpotCardProps) {
  const { user } = useAuth();

  const [resolvedName, setResolvedName] = useState<string | undefined>(userDisplayName);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(
    typeof spot.totalRatings === "number" ? spot.totalRatings : 0
  );
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<SpotComment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(
    typeof spot.reviewCount === "number" ? spot.reviewCount : 0
  );
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadDisplayName() {
      if (rankingUserId) {
        try {
          const qRef = query(
            collection(db, "users"),
            where("userId", "==", rankingUserId),
            limit(1)
          );
          const qs = await getDocs(qRef);
          if (!alive) return;
          if (!qs.empty) {
            const u = qs.docs[0].data() as any;
            setResolvedName(u.displayName || u.name || u.username || userName || "User");
            return;
          }
        } catch {}
      }
      setResolvedName(userName || "User");
    }

    loadDisplayName();
    return () => {
      alive = false;
    };
  }, [rankingUserId, userDisplayName, userName]);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!user || !spot.id) return;
      try {
        const bookmarks = await rankingsService.getUserBookmarks(user.uid);
        setIsBookmarked(bookmarks.includes(spot.id));
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };
    checkBookmarkStatus();
  }, [user, spot.id]);

  // LIVE counts: subscribe to spot doc for like/comment counters
  useEffect(() => {
    if (!spot?.id) return;
    const spotRef = doc(db, "spots", spot.id);
    const unsub = onSnapshot(spotRef, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (typeof d.totalRatings === "number") setLikeCount(d.totalRatings);
      if (typeof d.reviewCount === "number") setCommentCount(d.reviewCount);
    });
    return () => unsub();
  }, [spot?.id]);

  // INIT like state for this user
  useEffect(() => {
    let alive = true;

    const initLikeState = async () => {
      if (!user || !spot?.id) return;
      try {
        const likeRef = doc(db, "spots", spot.id, "likes", user.uid);
        const likeSnap = await getDoc(likeRef);
        if (!alive) return;
        setIsLiked(likeSnap.exists());
      } catch (e) {
        console.log("initLikeState error:", e);
      }
    };

    initLikeState();
    return () => {
      alive = false;
    };
  }, [user, spot?.id]);

  // LIVE latest 3 comments
  useEffect(() => {
    if (!spot?.id) return;
    const commentsRef = collection(db, "spots", spot.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"), limit(3));
    const unsub = onSnapshot(q, (snap) => {
      const list: SpotComment[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        list.push({
          id: docSnap.id,
          text: d.text,
          userId: d.userId,
          displayName: d.displayName,
          createdAt: d.createdAt,
        });
      });
      setComments(list);
    });
    return () => unsub();
  }, [spot?.id]);

  const toTitleCase = (name: string) =>
    name.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase());

  const goToUser = () => {
    if (!rankingUserId) return;
    router.push(`/user/${encodeURIComponent(rankingUserId)}`);
  };

  const handleBookmarkToggle = async () => {
    if (!user || !spot.id) return;
    if (rankingUserId === user.uid) {
      Alert.alert("Cannot bookmark", "You cannot bookmark your own spots");
      return;
    }
    setIsBookmarkLoading(true);
    try {
      await rankingsService.toggleBookmark(user.uid, spot.id);
      setIsBookmarked((prev) => !prev);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!user || !spot?.id) return;
    setIsLikeLoading(true);

    const spotRef = doc(db, "spots", spot.id);
    const likeRef = doc(db, "spots", spot.id, "likes", user.uid);

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    try {
      await runTransaction(db, async (tx) => {
        const likeSnap = await tx.get(likeRef);
        if (likeSnap.exists()) {
          tx.delete(likeRef);
          tx.update(spotRef, {
            totalRatings: increment(-1),
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.set(likeRef, {
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
          tx.update(spotRef, {
            totalRatings: increment(1),
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      setIsLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      Alert.alert("Error", "Failed to update like");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !spot?.id) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setIsCommentLoading(true);
    try {
      const commentsRef = collection(db, "spots", spot.id, "comments");
      const displayName =
        (user as any)?.displayName ||
        (user as any)?.email?.split("@")[0] ||
        "User";

      await addDoc(commentsRef, {
        text: trimmed,
        userId: user.uid,
        displayName,
        createdAt: serverTimestamp(),
      });

      // increment comment counter on spot
      const spotRef = doc(db, "spots", spot.id);
      await runTransaction(db, async (tx) => {
        tx.update(spotRef, {
          reviewCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      });

      setCommentText("");
      setCommentCount((c) => c + 1);
    } catch (e) {
      console.error("add comment error:", e);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsCommentLoading(false);
    }
  };

  return (
    <Pressable style={[styles.card, style]} onPress={() => onPress?.(spot)}>
      <View style={styles.cardContent}>
        <View style={styles.mainRow}>
          <View style={styles.spotInfo}>
            <View style={styles.spotNameRow}>
              <Pressable onPress={goToUser} accessibilityRole="link" hitSlop={6}>
                <Text style={[styles.spotName, styles.spotNameLink]}>
                  {toTitleCase(resolvedName || "User")}
                </Text>
              </Pressable>
              <Text style={[styles.spotName, styles.spotNameRegular]}> explored </Text>
              <Text style={[styles.spotName, styles.spotNameStrong]}>{spot.name}</Text>
            </View>
            <ThemedText style={styles.spotLocation} numberOfLines={1}>
              {spot.location.address}
            </ThemedText>
          </View>

          {userRating !== undefined && userRating !== null ? (
            <View
              style={[
                styles.ratingCircle,
                { backgroundColor: getRatingColor(userRating) },
              ]}
            >
              <Text style={styles.ratingText}>{userRating.toFixed(1)}</Text>
            </View>
          ) : spot.averageRating !== undefined &&
            spot.averageRating !== null &&
            spot.averageRating > 0 ? (
            <View
              style={[
                styles.ratingCircle,
                { backgroundColor: getRatingColor(spot.averageRating) },
              ]}
            >
              <Text style={styles.ratingText}>{spot.averageRating.toFixed(1)}</Text>
            </View>
          ) : (
            <View style={[styles.ratingCircle, { backgroundColor: "#6B7280" }]}>
              <Text style={styles.ratingText}>?</Text>
            </View>
          )}
        </View>

        <View style={styles.notesSection}>
          <ThemedText style={styles.notesLabel}>Your Notes:</ThemedText>
          <ThemedText style={styles.notesText}>
            {userNotes || "No notes added yet"}
          </ThemedText>
        </View>

        <View className="social" style={styles.socialSection}>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>💬</Text>
            <ThemedText style={styles.socialText}>
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </ThemedText>
          </View>

          <View style={styles.socialItem}>
            <Pressable
              onPress={handleLikeToggle}
              disabled={isLikeLoading || !user}
              style={{ flexDirection: "row", alignItems: "center" }}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? "Unlike spot" : "Like spot"}
            >
              <Text style={styles.socialIcon}>{isLiked ? "❤️" : "🤍"}</Text>
              <ThemedText style={styles.socialText}>
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </ThemedText>
            </Pressable>
          </View>

          <Pressable
            style={styles.socialItem}
            onPress={handleBookmarkToggle}
            disabled={isBookmarkLoading || rankingUserId === user?.uid}
          >
            <Text style={styles.socialIcon}>{isBookmarked ? "🔖" : "📖"}</Text>
            <ThemedText style={styles.socialText}>
              {isBookmarked ? "bookmarked" : "bookmark"}
            </ThemedText>
          </Pressable>
        </View>

        {/* Comment composer */}
        <View style={styles.commentComposer}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder={user ? "Add a comment…" : "Sign in to comment"}
            editable={!!user && !isCommentLoading}
            style={styles.commentInput}
            multiline
          />
          <Pressable
            onPress={handleAddComment}
            disabled={!user || isCommentLoading || !commentText.trim()}
            style={[
              styles.commentButton,
              (!user || isCommentLoading || !commentText.trim()) && { opacity: 0.5 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
          >
            <Text style={styles.commentButtonText}>{isCommentLoading ? "Posting…" : "Post"}</Text>
          </Pressable>
        </View>

        {/* Latest comments */}
        {comments.length > 0 && (
          <View style={styles.commentsList}>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.displayName || "User"}</Text>
                <Text style={styles.commentTextBody}>{c.text}</Text>
              </View>
            ))}
            {commentCount > comments.length && (
              <Text style={styles.viewAllHint}>
                View all {commentCount} comments
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  spotInfo: {
    flex: 1,
    marginRight: 12,
  },
  spotName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  spotNameStrong: { color: "#1A1A1A", fontWeight: "700" },
  spotNameRegular: { color: "#1A1A1A", fontWeight: "400" },
  spotNameLink: {
    color: "#2F4A43",
    fontWeight: "700",
  },
  spotLocation: {
    fontSize: 14,
    color: "#6B7280",
  },
  ratingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  notesSection: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
  },
  socialSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 8,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  socialText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  spotNameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  commentComposer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#FAFAFA",
  },
  commentButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#2F4A43",
    borderRadius: 8,
  },
  commentButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  commentsList: {
    marginTop: 8,
    gap: 8,
  },
  commentItem: {
    flexDirection: "column",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  commentTextBody: {
    fontSize: 14,
    color: "#374151",
  },
  viewAllHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
});
