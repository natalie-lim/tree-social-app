<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { spotsService } from "../../services/natureApp";

const PALETTE = {
  bg: "#F7F1E8",            // creamy background
  card: "#FFFFFF",
  text: "#3E3E3E",
  subtext: "#6F7B6F",       // leaf green-ish for secondary
  accent: "#6FA076",        // leafy green
  accentDark: "#5C8B64",
  divider: "#E6E0D6",
  inputBg: "#F8F4EE",
  border: "#DED7CB",
  externalBg: "#F1EFE9",    // muted tan/gray for external likes/comments
};

// Helper function to get the first photo URL from Firebase data
const getPhotoUrl = (photos) => {
  if (photos && photos.length > 0) {
    return photos[0].url || photos[0];
  }
  return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop';
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'hikes_trails': return '🥾';
    case 'parks_nature': return '🌲';
    case 'adventure_activities': return '🧗';
    case 'casual_outdoors': return '🌿';
    case 'wildlife_logs': return '🦅';
    default: return '📍';
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'moderate': return '#FF9800';
    case 'hard': return '#F44336';
    case 'expert': return '#9C27B0';
    default: return PALETTE.subtext;
  }
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await spotsService.searchSpots(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const renderSpotItem = ({ item }) => (
    <TouchableOpacity style={styles.spotCard} activeOpacity={0.8}>
      <View style={styles.spotImageContainer}>
        <Image 
          source={{ uri: getPhotoUrl(item.photos) }} 
          style={styles.spotImage}
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
        </View>
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>
      
      <View style={styles.spotInfo}>
        <Text style={styles.spotName}>{item.name}</Text>
        <Text style={styles.spotLocation}>📍 {item.location?.name || item.location?.address || 'Location not specified'}</Text>
        
        {item.description && (
          <Text style={styles.spotDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.spotMeta}>
          {item.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.averageRating.toFixed(1)}</Text>
            </View>
          )}
          {item.difficulty && item.difficulty !== 'varies' && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty.toUpperCase()}
              </Text>
            </View>
          )}
          {item.reviewCount > 0 && (
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewText}>{item.reviewCount} reviews</Text>
            </View>
          )}
        </View>

        {item.amenities && item.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            <Text style={styles.amenitiesTitle}>Amenities:</Text>
            <View style={styles.amenitiesList}>
              {item.amenities.slice(0, 3).map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity.replace('_', ' ')}</Text>
                </View>
              ))}
              {item.amenities.length > 3 && (
                <Text style={styles.moreAmenities}>+{item.amenities.length - 3} more</Text>
              )}
            </View>
          </View>
        )}
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 4).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {item.bestTimeToVisit && item.bestTimeToVisit.length > 0 && (
          <View style={styles.seasonContainer}>
            <Text style={styles.seasonText}>
              Best time: {item.bestTimeToVisit.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header brand */}
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>🌿</Text>
            <Text style={styles.brandName}>Leaflet</Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for places..."
                placeholderTextColor={PALETTE.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PALETTE.accent} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Search Results */}
          {searchQuery && !loading && !error && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeader}>
                {searchResults.length} place{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderSpotItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                style={styles.resultsList}
              />
            </View>
          )}

          {/* Empty State */}
          {!searchQuery && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🌲</Text>
              <Text style={styles.emptyTitle}>Discover Amazing Places</Text>
              <Text style={styles.emptyText}>Start typing to search for hiking trails, parks, and outdoor adventures</Text>
            </View>
          )}

          {/* Popular Categories */}
          {!searchQuery && !loading && (
            <View style={styles.categoriesContainer}>
              <Text style={styles.categoriesTitle}>Popular Categories</Text>
              <View style={styles.categoriesGrid}>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🥾</Text>
                  <Text style={styles.categoryCardText}>Hiking Trails</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🌲</Text>
                  <Text style={styles.categoryCardText}>Parks & Nature</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🧗</Text>
                  <Text style={styles.categoryCardText}>Adventure</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🌿</Text>
                  <Text style={styles.categoryCardText}>Casual Outdoors</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
=======
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// ---- Firestore (v9 modular) ----
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query as q,
  limit as qLimit,
  startAt,
} from "firebase/firestore";
import { db } from "../../config/firebase"; // <-- your initialized Firestore instance

const COLORS = {
  text: "#111827",
  subtext: "#6B7280",
  border: "#D1D5DB",
  bg: "#FFFFFF",
  accent: "#6FA076",
};
const BG = "#FFFAF0";

type TabKey = "locations" | "members";

type Spot = {
  id: string;
  name: string;
  name_lower?: string;
  city?: string;
  category?: string;
};
type UserLite = {
  id: string;
  handle?: string;
  username_lower?: string;
  displayName?: string;
  rank?: number;
  followers?: number;
};

type ResultItem = {
  id: string;
  title: string;
  subtitle?: string;
};

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean) // remove extra spaces
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}


export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("locations");

  // Search state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Recents (very simple in-memory; persist to AsyncStorage if you like)
  const [recents, setRecents] = useState<ResultItem[]>([
    { id: "u1", title: "Will Levy", subtitle: "@wlevy" },
    { id: "u2", title: "Bell Tran", subtitle: "@belltran" },
    { id: "u3", title: "Jane Doe", subtitle: "@janedoe" },
  ]);

  // Simple result cache: key = `${tab}|${q}`
  const cacheRef = useRef<Record<string, ResultItem[]>>({});

  const handleSubmit = () => {
    // optional: you can force-run search on submit (Enter)
    // but we already run on debounce below
    // runSearch();
  };

  // Normalize input for the index field ("*_lower")
  const normalized = useMemo(() => normalize(query), [query]);
  const debounced = useDebounced(normalized, 300);

  useEffect(() => {
    if (!overlayOpen) return;
    if (!debounced) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = `${tab}|${debounced}`;
    if (cacheRef.current[cacheKey]) {
      setResults(cacheRef.current[cacheKey]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const out = await searchFirestore(tab, debounced);
        if (cancelled) return;
        setResults(out);
        cacheRef.current[cacheKey] = out;
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Search failed");
        setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, tab, overlayOpen]);

  // Add a recent when user taps a result
  const onSelectResult = (item: ResultItem) => {
    setOverlayOpen(false);
    // naive recent push (dedupe by id)
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.id !== item.id)];
      return next.slice(0, 12);
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedView style={styles.container}>
        <Text style={styles.header}>Search</Text>

        {/* Top search bar (opens overlay on focus) */}
        <ThemedView style={styles.searchBarContainer}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setOverlayOpen(true)}
            placeholder="Search users, lists, content..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </ThemedView>

        <ThemedText>Search for users, lists, and content.</ThemedText>

        {/* ================= FULL-SCREEN OVERLAY ================= */}
        {overlayOpen && (
          <View style={styles.overlay} pointerEvents="auto">
            {/* Close (X) circle */}
            <Pressable
              style={styles.closeFab}
              onPress={() => setOverlayOpen(false)}
            >
              <Text style={{ fontSize: 18, color: COLORS.text }}>×</Text>
            </Pressable>

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
                <Pressable
                  style={styles.tab}
                  onPress={() => setTab("locations")}
                >
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
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSubmit}
                  placeholder={
                    tab === "locations"
                      ? "Search name or place…"
                      : "Search name or handle…"
                  }
                  placeholderTextColor={COLORS.subtext}
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

                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Suggested for you</Text>
                      <Pressable>
                        <Text style={styles.link}>See all</Text>
                      </Pressable>
                    </View>

                    {tab === "locations" ? (
                      <>
                        <ResultRow
                          title="Cafe Lumen"
                          subtitle="Cambridge • Coffee"
                          onPress={onSelectResult}
                        />
                        <ResultRow
                          title="Shiso Kitchen"
                          subtitle="Somerville • Japanese"
                          onPress={onSelectResult}
                        />
                        <ResultRow
                          title="Riverview Diner"
                          subtitle="Boston • American"
                          onPress={onSelectResult}
                        />
                      </>
                    ) : (
                      <>
                        <ResultRow
                          title="@charlie"
                          subtitle="Rank #12 • 240 followers"
                          onPress={onSelectResult}
                        />
                        <ResultRow
                          title="@mia"
                          subtitle="Rank #33 • 120 followers"
                          onPress={onSelectResult}
                        />
                        <ResultRow
                          title="@alex"
                          subtitle="Rank #58 • 90 followers"
                          onPress={onSelectResult}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        {loading ? "Searching…" : error ? "Error" : "Results"}
                      </Text>
                      {!!debounced && (
                        <Text style={{ color: COLORS.subtext }}>
                          {debounced}
                        </Text>
                      )}
                    </View>

                    {error ? (
                      <Text style={{ color: "#B91C1C" }}>{error}</Text>
                    ) : results.length === 0 && !loading ? (
                      <Text style={{ color: COLORS.subtext }}>No matches.</Text>
                    ) : (
                      results.map((r) => (
                        <ResultRow
                          key={`${r.id}`}
                          title={r.title}
                          subtitle={r.subtitle}
                          onPress={onSelectResult}
                        />
                      ))
                    )}
                  </>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        )}
      </ThemedView>
>>>>>>> origin/main
    </SafeAreaView>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Strip diacritics + lowercase to match your `*_lower` fields
function normalize(s: string) {
  return (
    s
      .normalize("NFKD")
      // @ts-ignore — Unicode property escapes supported in Hermes/JSI RN 0.72+
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim()
  );
}

/**
 * Firestore prefix search
 * - locations -> collection("spots"), orderBy("name_lower")
 * - members   -> collection("users"), orderBy("username_lower")
 * Returns a unified ResultItem[]
 *
 * NOTE: Ensure you have composite indexes if you add extra where() later.
 */
async function searchFirestore(tab: TabKey, queryInput: string): Promise<ResultItem[]> {
  if (!queryInput) return [];

  console.log("Searching for:", queryInput);

  if (tab === "locations") {
    const ref = collection(db, "spots");
    const formattedQuery = toTitleCase(queryInput);
    
    const queryRef = q(
      ref,
      orderBy("name"),
      startAt(formattedQuery),
      endAt(formattedQuery + "\uf8ff"),
      qLimit(20)
    );
    const snap = await getDocs(queryRef);
    console.log("Found documents:", snap.docs.length);
    return snap.docs.map(d => {
      const data = d.data() as Spot;
      console.log("Document data:", data);
      return { 
        id: d.id || `spot_${Date.now()}_${Math.random()}`, 
        title: data?.name || "(untitled)", 
        subtitle: buildLocationSubtitle(data) 
      };
    });
  } else {
    const ref = collection(db, "users");
    const formattedQuery = toTitleCase(queryInput);
    
    const queryRef = q(
      ref,
      orderBy("displayName"),
      startAt(formattedQuery),
      endAt(formattedQuery + "\uf8ff"),
      qLimit(20)
    );
    const snap = await getDocs(queryRef);
    console.log("Found users:", snap.docs.length);
    return snap.docs.map(d => {
      const u = d.data() as UserLite;
      const title = u?.handle ? `@${u.handle}` : u?.displayName || "(user)";
      const subtitle =
        u?.displayName && u?.handle
          ? `${u.displayName}`
          : u?.followers || u?.rank
          ? `Rank #${u.rank ?? "-"} • ${u.followers ?? 0} followers`
          : undefined;
      return { 
        id: d.id || `user_${Date.now()}_${Math.random()}`, 
        title, 
        subtitle 
      };
    });
  }
}

function buildLocationSubtitle(s: Spot) {
  if (!s) return undefined;
  const bits = [s.city, s.category].filter(Boolean);
  return bits.length ? bits.join(" • ") : undefined;
}

/* ---------- Presentational ---------- */

function ResultRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: (item: ResultItem) => void;
}) {
  const item = useMemo(
    () => ({ id: title, title, subtitle }),
    [title, subtitle]
  );
  return (
    <Pressable
      onPress={() => onPress?.(item)}
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

/* ---------- Styles (unchanged) ---------- */

const styles = StyleSheet.create({
<<<<<<< HEAD
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  root: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingBottom: 40 },

  brandRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  brandLogo: { fontSize: 25, marginRight: 8 },
  brandName: { fontSize: 25, fontWeight: "700", color: "#7DA384", letterSpacing: 0.3 },

  searchContainer: { paddingHorizontal: 20, marginTop: 8 },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.inputBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: { fontSize: 18, marginRight: 12, color: PALETTE.subtext },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PALETTE.text,
    paddingVertical: 0,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: PALETTE.subtext,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    textAlign: "center",
  },

  resultsContainer: { paddingHorizontal: 20, marginTop: 16 },
  resultsHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 16,
  },
  resultsList: { marginBottom: 20 },

  spotCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  spotImageContainer: {
    position: "relative",
    height: 160,
  },
  spotImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EEE",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: { fontSize: 20 },
  verifiedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: PALETTE.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  spotInfo: { padding: 16 },
  spotName: {
    fontSize: 20,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 4,
  },
  spotLocation: {
    fontSize: 14,
    color: PALETTE.subtext,
    marginBottom: 8,
  },
  spotDescription: {
    fontSize: 14,
    color: PALETTE.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  spotMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    backgroundColor: PALETTE.externalBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.text,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewContainer: {
    backgroundColor: PALETTE.externalBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: "500",
    color: PALETTE.subtext,
  },
  amenitiesContainer: {
    marginBottom: 12,
  },
  amenitiesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.text,
    marginBottom: 6,
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityTag: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: PALETTE.accent,
    fontWeight: "500",
  },
  moreAmenities: {
    fontSize: 12,
    color: PALETTE.subtext,
    fontStyle: "italic",
    alignSelf: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: PALETTE.externalBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: PALETTE.subtext,
    fontWeight: "500",
  },
  seasonContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  seasonText: {
    fontSize: 12,
    color: "#E65100",
    fontWeight: "500",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: PALETTE.subtext,
    textAlign: "center",
    lineHeight: 22,
  },

  categoriesContainer: { paddingHorizontal: 20, marginTop: 20 },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryCardIcon: { fontSize: 32, marginBottom: 8 },
  categoryCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.text,
    textAlign: "center",
=======
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: "lowercase",
  },

  searchBarContainer: { marginBottom: 20 },
  searchInput: {
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    fontSize: 16,
  },

  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: BG,
    zIndex: 999,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  closeFab: {
    position: "absolute",
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEE9DC",
    alignItems: "center",
    justifyContent: "center",
  },

  brandRow: {
    paddingTop: 4,
    paddingBottom: 6,
    paddingRight: 56,
  },
  brandText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.accent,
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
    color: COLORS.subtext,
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
  tabUnderline: {
    marginTop: 10,
    height: 3,
    width: "100%",
    backgroundColor: "transparent",
  },
  tabUnderlineActive: {
    backgroundColor: COLORS.accent,
  },

  overlaySearchWrap: {
    marginTop: 12,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 12,
    fontSize: 18,
    color: COLORS.subtext,
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
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  link: { fontSize: 14, fontWeight: "800", color: COLORS.accent },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  chevron: { fontSize: 24, color: "#9CA3AF", marginLeft: 8 },
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
    backgroundColor: "#E5E7EB",
    marginBottom: 6,
  },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  handle: { fontSize: 12, color: "#6B7280" },
  closeDot: {
    position: "absolute",
    top: 0,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
>>>>>>> origin/main
  },
});
