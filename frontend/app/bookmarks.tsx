// bookmarks.tsx
import { SlimUnrankedCard } from "@/components/SlimUnrankedCard";
import { Spot } from "@/components/SpotCard";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { firestoreService, rankingsService } from "../services/firestore";

const COLORS = {
  bg: "#F7F1E8", // creamy beige to match other screens
  brand: "#2F4A43",
  chip: "#1F5B4E",
  chipText: "#FFFFFF",
  text: "#222326",
  sub: "#6F7B6F",
  inputBg: "#F2F4F5",
  border: "#E3E6E8",
};

export default function Bookmarks() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    // Hide the native stack header so only our beige header shows
    navigation.setOptions({ headerShown: false } as any);
  }, [navigation]);

  const { user } = useAuth();
  const [bookmarkedSpots, setBookmarkedSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async (isRefresh = false) => {
    if (!user) {
      setError("Please log in to view bookmarks");
      setLoading(false);
      return;
    }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const bookmarkIds = await rankingsService.getUserBookmarks(user.uid);
      if (bookmarkIds.length === 0) {
        setBookmarkedSpots([]);
        return;
      }

      const spots: Spot[] = [];
      for (const spotId of bookmarkIds) {
        try {
          const spot = await firestoreService.read("spots", spotId);
          if (spot) spots.push(spot as Spot);
        } catch (err) {
          console.warn(`Could not fetch spot ${spotId}:`, err);
        }
      }
      setBookmarkedSpots(spots);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("Failed to load bookmarks");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  const handleSpotPress = (spot: Spot) => {
    router.push({
      pathname: "/spot-detail",
      params: { spotData: JSON.stringify(spot) },
    });
  };

  const onRefresh = () => fetchBookmarks(true);
  const handleBackPress = () => router.back();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.brand]}
            tintColor={COLORS.brand}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={COLORS.brand} />
          </TouchableOpacity>
          <Text style={styles.title}>Bookmarks</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading bookmarks...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookmarks()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : bookmarkedSpots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={COLORS.sub} />
            <Text style={styles.emptyTitle}>No bookmarks yet</Text>
            <Text style={styles.emptySubtext}>
              Bookmark spots you want to visit later by tapping the bookmark icon on any spot card
            </Text>
          </View>
        ) : (
          <View style={styles.spotsContainer}>
            {bookmarkedSpots.map((spot) => (
              <SlimUnrankedCard
                key={spot.id}
                spot={spot}
                onPress={handleSpotPress}
                style={styles.spotCard}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screen: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginBottom: 8,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.brand },
  placeholder: { width: 40 },

  loadingContainer: { justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.sub },

  errorContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginTop: 20,
  },
  errorText: { fontSize: 16, color: COLORS.sub, textAlign: "center", marginBottom: 16 },
  retryButton: { backgroundColor: COLORS.chip, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: COLORS.chipText, fontSize: 16, fontWeight: "600" },

  emptyContainer: { justifyContent: "center", alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: COLORS.sub, textAlign: "center", lineHeight: 22 },

  spotsContainer: { marginTop: 8 },
  spotCard: { marginBottom: 8 },
});
