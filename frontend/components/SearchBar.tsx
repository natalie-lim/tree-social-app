// components/SearchBar.tsx
import { Spot as SpotCardType } from "@/components/SpotCard";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Firestore imports
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query as q,
  limit as qLimit,
  startAt,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Types
export type TabKey = "locations" | "members";

export type Spot = {
  id: string;
  name: string;
  name_lower?: string;
  city?: string;
  category?: string;
};

export type UserLite = {
  id: string;
  handle?: string;
  username_lower?: string;
  displayName?: string;
  rank?: number;
  followers?: number;
};

export type ResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  spotData?: SpotCardType;
};

// Utility functions
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buildLocationSubtitle(s: SpotCardType): string | undefined {
  if (!s) return undefined;
  const bits = [];

  if (s.location?.address) {
    bits.push(s.location.address);
  }

  if (s.category) {
    const categoryFormatted = s.category.replace(/_/g, " ").toUpperCase();
    bits.push(categoryFormatted);
  }

  if (s.averageRating > 0) {
    bits.push(`⭐ ${s.averageRating.toFixed(1)}`);
  }

  if (s.isVerified) {
    bits.push("✓ Verified");
  }

  return bits.length ? bits.join(" • ") : undefined;
}

// Debounced hook
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Search function
async function searchFirestore(
  tab: TabKey,
  queryInput: string
): Promise<ResultItem[]> {
  if (!queryInput) return [];

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

    return snap.docs.map((d) => {
      const data = d.data() as SpotCardType;
      const spotDataWithId = {
        ...data,
        id: d.id || `spot_${Date.now()}_${Math.random()}`,
      };
      return {
        id: d.id || `spot_${Date.now()}_${Math.random()}`,
        title: data?.name || "(untitled)",
        subtitle: buildLocationSubtitle(data),
        spotData: spotDataWithId,
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
    return snap.docs.map((d) => {
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
        subtitle,
      };
    });
  }
}

// Props interface
interface SearchBarProps {
  placeholder?: string;
  onResultSelect?: (result: ResultItem) => void;
  onSpotPress?: (spot: SpotCardType) => void;
  showTabs?: boolean;
  defaultTab?: TabKey;
  style?: any;
  inputStyle?: any;
  containerStyle?: any;
}

// Main SearchBar component
export default function SearchBar({
  placeholder = "Search places, people, and content...",
  onResultSelect,
  onSpotPress,
  showTabs = true,
  defaultTab = "locations",
  style,
  inputStyle,
  containerStyle,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>(defaultTab);
  const [isFocused, setIsFocused] = useState(false);

  // Search state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Simple result cache
  const cacheRef = useRef<Record<string, ResultItem[]>>({});

  // Normalize and debounce input
  const normalized = useMemo(() => normalize(query), [query]);
  const debounced = useDebounced(normalized, 300);

  // Search effect
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

  const handleFocus = () => {
    setIsFocused(true);
    setOverlayOpen(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleResultSelect = (item: ResultItem) => {
    setOverlayOpen(false);
    if (onResultSelect) {
      onResultSelect(item);
    }
  };

  const handleSpotPress = (spot: SpotCardType) => {
    setOverlayOpen(false);
    if (onSpotPress) {
      onSpotPress(spot);
    } else {
      // Default navigation
      router.push({
        pathname: "/spot-detail",
        params: {
          spotData: JSON.stringify(spot),
        },
      });
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Search Input */}
      <View
        style={[
          styles.searchInputContainer,
          isFocused && styles.searchInputFocused,
          style,
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.subtext}
          style={[styles.searchInput, inputStyle]}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Full-screen overlay */}
      {overlayOpen && (
        <View style={styles.overlay} pointerEvents="auto">
          {/* Close button */}
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
            {/* Brand */}
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>leaflet</Text>
            </View>

            {/* Tabs */}
            {showTabs && (
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
            )}

            {/* Search input in overlay */}
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
                placeholderTextColor={COLORS.subtext}
                style={styles.overlayInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            {/* Results */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {loading ? "Searching…" : error ? "Error" : "Results"}
                </Text>
                {!!debounced && (
                  <Text style={{ color: COLORS.subtext }}>{debounced}</Text>
                )}
              </View>

              {error ? (
                <Text style={{ color: "#B91C1C" }}>{error}</Text>
              ) : results.length === 0 && !loading ? (
                <Text style={{ color: COLORS.subtext }}>No matches.</Text>
              ) : (
                results.map((r) => {
                  if (tab === "locations" && r.spotData) {
                    return (
                      <ResultRow
                        key={r.id}
                        title={r.title}
                        subtitle={r.subtitle}
                        onPress={() => handleSpotPress(r.spotData!)}
                      />
                    );
                  } else {
                    return (
                      <ResultRow
                        key={r.id}
                        title={r.title}
                        subtitle={r.subtitle}
                        onPress={() => handleResultSelect(r)}
                      />
                    );
                  }
                })
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

// Result row component
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

// Colors
const COLORS = {
  text: "#111827",
  subtext: "#6B7280",
  border: "#D1D5DB",
  bg: "#FFFFFF",
  accent: "#6FA076",
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInputFocused: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
    paddingVertical: 0,
  },
  searchIcon: {
    fontSize: 18,
    color: COLORS.accent,
  },
  overlay: {
    position: "absolute",
    top: -50, // Adjust based on your layout
    left: -20,
    right: -20,
    bottom: -100,
    backgroundColor: "#FFFAF0",
    zIndex: 999,
    paddingHorizontal: 16,
    paddingTop: 60,
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
