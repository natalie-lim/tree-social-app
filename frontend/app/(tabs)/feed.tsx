// app/(tabs)/feed.tsx
import { Spot, SpotCard } from "@/components/SpotCard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { firestoreService } from "../../services/firestore";

const COLORS = {
  bg: "#FFF6EC", // soft cream
  brand: "#2F4A43", // deep green (logo / active)
  chip: "#1F5B4E", // dark teal for buttons
  chipText: "#FFFFFF",
  text: "#222326",
  sub: "#6F7276",
  inputBg: "#F2F4F5",
  border: "#E3E6E8",
};

export default function Feed() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get all users
      const users = await firestoreService.getAll("users");
      console.log("Fetched users:", users.length);

      // Step 2: Get all rankings from users (rankings is an array field in each user document)
      const allRankings = [];
      for (const user of users) {
        try {
          // Access rankings array directly from user document
          const userWithRankings = user as any; // Type assertion to access rankings property
          if (
            userWithRankings.rankings &&
            Array.isArray(userWithRankings.rankings)
          ) {
            console.log(
              `User ${user.id} has ${userWithRankings.rankings.length} rankings:`,
              userWithRankings.rankings
            );
            allRankings.push(...userWithRankings.rankings);
          } else {
            console.log(
              `User ${user.id} has no rankings or rankings is not an array`
            );
          }
        } catch (err) {
          console.log(
            `Error accessing rankings for user ${user.id}:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }
      console.log("Total rankings found:", allRankings.length);

      // Step 3: Extract unique spotIds from rankings
      console.log("Sample ranking structure:", allRankings[0]); // Debug: see the actual structure
      const spotIds = [
        ...new Set(
          allRankings
            .map((ranking: any) => {
              // Try different possible nested structures for spotId
              const spotId =
                ranking.spotId ||
                ranking.data?.spotId ||
                ranking.spot?.id ||
                ranking.spotId ||
                ranking.spotId;
              console.log(`Extracted spotId from ranking:`, spotId); // Debug: see what we extracted
              return spotId;
            })
            .filter(Boolean)
        ),
      ];

      // Step 4: Get all spots and match by name
      const allSpots = await firestoreService.getAll("spots");

      // Step 5: Filter spots that match the spotIds from rankings
      const matchedSpots = allSpots.filter((spot) => spotIds.includes(spot.id));

      setSpots(matchedSpots as Spot[]);
    } catch (err) {
      console.error("Error fetching spots:", err);
      setError("Failed to load spots");
    } finally {
      setLoading(false);
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: 60, paddingBottom: 24 }}
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
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.sub} />
        <TextInput
          placeholder="Search a place, member, etc."
          placeholderTextColor={COLORS.sub}
          style={styles.searchInput}
          onSubmitEditing={(e) =>
            router.push({
              pathname: "/(tabs)/search",
              params: { q: e.nativeEvent.text },
            })
          }
          returnKeyType="search"
        />
      </View>

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
          <TouchableOpacity style={styles.retryButton} onPress={fetchSpots}>
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
        spots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onPress={handleSpotPress}
            style={styles.spotCard}
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
    backgroundColor: COLORS.inputBg,
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
    color: COLORS.text,
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
    color: COLORS.sub,
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
