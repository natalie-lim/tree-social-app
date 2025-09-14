// app/(tabs)/feed.tsx
import { Spot, SpotCard } from "@/components/SpotCard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { firestoreService } from "../../services/firestore";

// Extended Spot type for feed with ranking user information
interface SpotWithRanking extends Spot {
  rankingUser?: {
    userId: string;
    userName: string;
    userDisplayName: string;
    userNotes?: string;
  };
}

const COLORS = {
  bg: "#FFF6EC", // soft cream
  brand: "#2F4A43", // deep green (logo / active)
  chip: "#1F5B4E", // dark teal for buttons
  chipText: "#FFFFFF",
  text: "#222326",
  sub: "#3E3E3E",
  inputBg: "#F2F4F5",
  border: "#E3E6E8",
};

export default function Feed() {
  const { user } = useAuth();
  const [spots, setSpots] = useState<SpotWithRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Step 1: Get all users
      const users = await firestoreService.getAll("users");

      // Step 2: Get all rankingIds from users and fetch full ranking documents
      const allRankingIds = [];
      for (const user of users) {
        try {
          // Access rankings array directly from user document
          const userWithRankings = user as any; // Type assertion to access rankings property
          if (
            userWithRankings.rankings &&
            Array.isArray(userWithRankings.rankings)
          ) {
            // Extract rankingIds from user's rankings array
            const userRankingIds = userWithRankings.rankings
              .map((ranking: any) => ranking.rankingId)
              .filter(Boolean);
            allRankingIds.push(...userRankingIds);
          }
        } catch (err) {
          console.log(
            `Error accessing rankings for user ${user.id}:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }

      // Step 3: Fetch all rankings ordered by createdAt (most recent first)
      const allRankings = await firestoreService.query('rankings', [], 'createdAt', 100);

      // Step 4: Get all spots for matching
      const allSpots = await firestoreService.getAll("spots");

      // Step 5: Create spots with user information from rankings (already sorted by createdAt desc)
      const spotsWithUsers = [];
      for (const ranking of allRankings) {
        const rankingData = ranking as any; // Type assertion to access ranking properties
        const spotId = rankingData.spotId;
        const userId = rankingData.userId; // Use userId field from ranking document


        if (spotId && userId) {
          // Include all users' activities, including current user

          const matchingSpot = allSpots.find((spot) => spot.id === spotId);
          if (matchingSpot) {
            // Fetch user data from users collection
            let userData = null;
            try {
              userData = await firestoreService.read("users", userId);
              const userDataDebug = userData as any;
            } catch (err) {}

            const userDataTyped = userData as any; // Type assertion to access user properties
            const finalUserName =
              userDataTyped?.displayName || userDataTyped?.email || "User";

            spotsWithUsers.push({
              ...matchingSpot,
              rankingUser: {
                userId: userId,
                userName: finalUserName,
                userDisplayName: finalUserName,
                userNotes:
                  rankingData.note ||
                  rankingData.notes ||
                  rankingData.description,
                createdAt: rankingData.createdAt || rankingData.timestamp,
              },
            });
          }
        }
      }

      setSpots(spotsWithUsers as SpotWithRanking[]);
      // Rankings are already sorted by createdAt desc from the query
      // No additional sorting needed since we're processing them in order
      setSpots(spotsWithUsers as any[]);
    } catch (err) {
      console.error("Error fetching spots:", err);
      setError("Failed to load spots");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSpotPress = (spot: Spot) => {
    router.push({
      pathname: "/spot-detail",
      params: {
        spotData: JSON.stringify(spot),
      },
    });
  };

  const onRefresh = () => {
    fetchSpots(true);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: 60, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.brand]} // Android
          tintColor={COLORS.brand} // iOS
        />
      }
    >
      {/* Top bar */}
      <View style={styles.topRow}>
        <Text style={styles.brand}>leaflet</Text>

        <View style={styles.icons}>
          <Ionicons name="calendar-outline" size={22} color={COLORS.text} />
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.text}
            style={{ marginLeft: 14 }}
          />
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchWrap}
        onPress={() => router.push("/(tabs)/search")}
      >
        <Ionicons name="search-outline" size={18} color={COLORS.sub} />
        <Text style={styles.searchInput}>Search a place, member, etc.</Text>
      </TouchableOpacity>

      {/* Pills row */}
      <View style={styles.pillsRow}>
        <Pill
          icon="calendar-outline"
          label="Add Place"
          onPress={() => router.push("/add-place")}
        />
        <Pill
          icon="navigate-outline"
          label="Open Map"
          onPress={() => router.push("/map")}
        />
      </View>

      {/* Feed content */}
      <Text style={styles.sectionTitle}>Discover Spots</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={styles.loadingText}>Loading spots...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSpots()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : spots.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No spots found</Text>
          <Text style={styles.cardSub}>
            Be the first to add a spot to your area!
          </Text>
        </View>
      ) : (
        spots.map((spot: any, index: number) => (
          <SpotCard
            key={`${spot.id}-${spot.rankingUser?.userId || index}`}
            spot={spot}
            onPress={handleSpotPress}
            style={styles.spotCard}
            rankingUserId={spot.rankingUser?.userId}
            userName={spot.rankingUser?.userName}
            userDisplayName={spot.rankingUser?.userDisplayName}
            userNotes={spot.rankingUser?.userNotes}
          />
        ))
      )}
    </ScrollView>
  );
}

function Pill({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.pill}>
      <Ionicons name={icon} size={16} color={COLORS.chipText} />
      <Text style={styles.pillText} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 14, // bump content down a bit
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  icons: { flexDirection: "row", alignItems: "center" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.sub,
  },

  pillsRow: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 10,
    columnGap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.chip,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pillText: {
    color: COLORS.chipText,
    fontWeight: "700",
    marginLeft: 6,
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  cardSub: {
    marginTop: 6,
    color: COLORS.text,
  },
  spotCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.sub,
  },
  errorContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.sub,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.chip,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.chipText,
    fontSize: 16,
    fontWeight: "600",
  },
});
