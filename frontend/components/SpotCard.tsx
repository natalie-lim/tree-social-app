import { collection, getDocs, limit, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { ThemedText } from "./themed-text";

// Types based on the document structure
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
  reviewCount: number;
  totalRatings: number;
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
}

const { width } = Dimensions.get("window");

export function SpotCard({
  spot,
  onPress,
  style,
  rankingUserId,
  userName,
  userDisplayName,
  userNotes,
}: SpotCardProps) {
  const [resolvedName, setResolvedName] = useState<string | undefined>(
    userDisplayName
  );

  useEffect(() => {
    let alive = true;

    async function loadDisplayName() {
  
      // 1) Preferred: lookup by userId field in users collection
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
            setResolvedName(
              u.displayName || u.name || u.username || userName || "User"
            );
            return;
          }
        } catch (e) {
          // swallow/log if you want
        }
      }
      // 3) Last resort
      setResolvedName(userName || "User");
    }

    loadDisplayName();
    return () => {
      alive = false;
    };
  }, [rankingUserId, userDisplayName, userName]);

  const accentColor = "#6FA076";

  return (
    <Pressable style={[styles.card, style]} onPress={() => onPress?.(spot)}>
      <View style={styles.cardContent}>
        {/* Main Row */}
        <View style={styles.mainRow}>
          {/* Left side - Spot info */}
          <View style={styles.spotInfo}>
            <ThemedText style={styles.spotName} numberOfLines={1}>
              {spot.name}
            </ThemedText>
            <ThemedText style={styles.spotLocation} numberOfLines={1}>
              {spot.location.address}
            </ThemedText>
          </View>

          {/* Right side - Rating circle */}
          {spot.averageRating > 0 && (
            <View style={styles.ratingCircle}>
              <Text style={styles.ratingText}>
                {spot.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* User Section */}
        {resolvedName && (
          <View style={styles.userSection}>
            <Text style={styles.userIcon}>👤</Text>
            <ThemedText style={styles.userText}>
              {resolvedName}'s ranking
            </ThemedText>
          </View>
        )}

        {/* User Notes Section */}
        <View style={styles.notesSection}>
          <ThemedText style={styles.notesLabel}>Your Notes:</ThemedText>
          <ThemedText style={styles.notesText}>
            {userNotes || spot.description || "No notes added yet"}
          </ThemedText>
        </View>

        {/* Comments and Likes Section */}
        <View style={styles.socialSection}>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>💬</Text>
            <ThemedText style={styles.socialText}>
              {spot.reviewCount || 0} comments
            </ThemedText>
          </View>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>❤️</Text>
            <ThemedText style={styles.socialText}>
              {spot.totalRatings || 0} likes
            </ThemedText>
          </View>
        </View>
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

  // Main row with spot info and rating
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
    color: "#111827",
    marginBottom: 4,
  },
  spotLocation: {
    fontSize: 14,
    color: "#6B7280",
  },
  ratingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6FA076",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // User section
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F0F9FF",
    borderRadius: 6,
  },
  userIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  userText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "600",
  },

  // Notes section
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

  // Social section
  socialSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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
});
