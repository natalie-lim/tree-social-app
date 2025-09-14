// app/(tabs)/feed.tsx
import { Spot, SpotCard } from "@/components/SpotCard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  normalize,
  ResultItem,
  searchFirestore,
  TabKey,
  useDebounced,
} from "../components/searchService";
import { useAuth } from "../contexts/AuthContext";
import { firestoreService } from "../services/firestore";

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

export default function SearchOverlay() {
  const { user } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("locations");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recents, setRecents] = useState<ResultItem[]>([]);

  // Simple result cache: key = `${tab}|${q}`
  const cacheRef = useRef<Record<string, ResultItem[]>>({});

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      setLoading(true);
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

      // Step 3: Fetch full ranking documents from rankings collection
      const allRankings = [];
      for (const rankingId of allRankingIds) {
        try {
          const rankingDoc = await firestoreService.read("rankings", rankingId);
          if (rankingDoc) {
            allRankings.push({
              ...rankingDoc,
              id: rankingId,
            });
          }
        } catch (err) {}
      }

      // Step 4: Extract unique spotIds from rankings
      const spotIds = [
        ...new Set(
          allRankings
            .map((ranking: any) => {
              // Extract spotId from ranking document
              const spotId = ranking.spotId;
              return spotId;
            })
            .filter(Boolean)
        ),
      ];

      // Step 5: Get all spots and match by name
      const allSpots = await firestoreService.getAll("spots");

      // Step 6: Create spots with user information from users collection
      const spotsWithUsers = [];
      for (const ranking of allRankings) {
        const rankingData = ranking as any; // Type assertion to access ranking properties
        const spotId = rankingData.spotId;
        const userId = rankingData.userId; // Use userId field from ranking document

        if (spotId && userId) {
          // Skip if this ranking belongs to the current user
          if (user && userId === user.uid) {
            continue;
          }

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
              },
            });
          }
        }
      }

      setSpots(spotsWithUsers as any[]);
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

  // Search logic
  const normalized = useMemo(() => normalize(query), [query]);
  const debounced = useDebounced(normalized, 300);

  // Search effect
  useEffect(() => {
    if (!showSearchOverlay) return;
    if (!debounced) {
      setResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const cacheKey = `${tab}|${debounced}`;
    if (cacheRef.current[cacheKey]) {
      setResults(cacheRef.current[cacheKey]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const out = await searchFirestore(tab, debounced);
        if (cancelled) return;
        setResults(out);
        cacheRef.current[cacheKey] = out;
      } catch (e: any) {
        if (cancelled) return;
        setSearchError(e?.message || "Search failed");
        setResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, tab, showSearchOverlay]);

  // Handle result selection from search
  const onSelectResult = (item: ResultItem) => {
    setShowSearchOverlay(false);
    // naive recent push (dedupe by id)
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.id !== item.id)];
      return next.slice(0, 12);
    });
  };

  // Handle spot press from search
  const handleSearchSpotPress = (spot: any) => {
    setShowSearchOverlay(false);
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
      <TouchableOpacity
        style={styles.searchBarContainer}
        onPress={() => setShowSearchOverlay(true)}
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.sub} />
          <Text style={styles.searchInput}>
            Search places, people, and content...
          </Text>
        </View>
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
        spots.map((spot: any) => (
          <SpotCard
            key={spot.id}
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

      {/* Search overlay */}
      {showSearchOverlay && (
        <View style={styles.searchOverlay}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Brand row */}
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>leaflet</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <Pressable style={styles.tab} onPress={() => setTab("locations")}>
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "locations" && styles.tabLabelActive,
                  ]}
                >
                  Locations
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    tab === "locations" && styles.tabUnderlineActive,
                  ]}
                />
              </Pressable>

              <Pressable style={styles.tab} onPress={() => setTab("members")}>
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "members" && styles.tabLabelActive,
                  ]}
                >
                  Members
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    tab === "members" && styles.tabUnderlineActive,
                  ]}
                />
              </Pressable>
            </View>

            {/* Overlay search field */}
            <View style={styles.overlaySearchWrap}>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder={
                  tab === "locations"
                    ? "Search name or place…"
                    : "Search name or handle…"
                }
                placeholderTextColor={COLORS.sub}
                style={styles.overlayInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            {/* Content area */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* If no query, show Recents + Suggested */}
              {!debounced ? (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recents</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 8 }}
                  >
                    {recents.map((r) => (
                      <Pressable key={r.id} onPress={() => setQuery(r.title)}>
                        <RecentPill
                          name={r.title}
                          handle={r.subtitle?.replace("@", "") || ""}
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      {searchLoading
                        ? "Searching…"
                        : searchError
                        ? "Error"
                        : "Results"}
                    </Text>
                    {!!debounced && (
                      <Text style={{ color: COLORS.sub }}>{debounced}</Text>
                    )}
                  </View>

                  {searchError ? (
                    <Text style={{ color: "#B91C1C" }}>{searchError}</Text>
                  ) : results.length === 0 && !searchLoading ? (
                    <Text style={{ color: COLORS.sub }}>No matches.</Text>
                  ) : (
                    results.map((r) => {
                      if (tab === "locations" && r.spotData) {
                        return (
                          <ResultRow
                            key={r.id}
                            title={r.title}
                            subtitle={r.subtitle}
                            onPress={() => handleSearchSpotPress(r.spotData!)}
                          />
                        );
                      } else {
                        return (
                          <ResultRow
                            key={r.id}
                            title={r.title}
                            subtitle={r.subtitle}
                            onPress={() => onSelectResult(r)}
                          />
                        );
                      }
                    })
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          <TouchableOpacity
            style={styles.closeSearchButton}
            onPress={() => setShowSearchOverlay(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
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

function ResultRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={rowStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={rowStyles.title}>{title}</Text>
          {subtitle ? <Text style={rowStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={rowStyles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function RecentPill({ name, handle }: { name: string; handle: string }) {
  return (
    <View style={recentStyles.pill}>
      <View style={recentStyles.avatar} />
      <Text style={recentStyles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={recentStyles.handle} numberOfLines={1}>
        {handle}
      </Text>
      <View style={recentStyles.closeDot}>
        <Text style={{ fontSize: 14, color: COLORS.text }}>×</Text>
      </View>
    </View>
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

  searchBarContainer: {
    marginBottom: 14,
  },
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
  searchOverlay: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    zIndex: 999,
  },
  closeSearchButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  brandRow: {
    paddingTop: 4,
    paddingBottom: 6,
    paddingRight: 56,
  },
  brandText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.brand,
    textTransform: "lowercase",
    letterSpacing: 0.3,
  },
  tabsRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.sub,
  },
  tabLabelActive: {
    color: COLORS.brand,
  },
  tabUnderline: {
    marginTop: 10,
    height: 3,
    width: "100%",
    backgroundColor: "transparent",
  },
  tabUnderlineActive: {
    backgroundColor: COLORS.brand,
  },
  overlaySearchWrap: {
    position: "relative",
  },
  overlayInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingLeft: 40,
    paddingRight: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },
  scrollArea: { flex: 1, marginTop: 14 },
  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 8,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.sub, marginTop: 2 },
  chevron: { fontSize: 24, color: COLORS.sub, marginLeft: 8 },
});

const recentStyles = StyleSheet.create({
  pill: {
    width: 110,
    marginRight: 12,
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.inputBg,
    marginBottom: 6,
  },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  handle: { fontSize: 12, color: COLORS.sub },
  closeDot: {
    position: "absolute",
    top: 0,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
