import { Spot as SpotCardType } from "@/components/SpotCard";
import { router } from "expo-router";
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

// Import search service
import {
  normalize,
  ResultItem,
  searchFirestore,
  TabKey,
  useDebounced,
} from "../../components/searchService";

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
const BG = "#FFF6EC";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("locations");

  // Search state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Recents (very simple in-memory; persist to AsyncStorage if you like)
  const [recents, setRecents] = useState<ResultItem[]>([]);

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
  }, [debounced, tab]);

  // Add a recent when user taps a result
  const onSelectResult = (item: ResultItem) => {
    // naive recent push (dedupe by id)
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.id !== item.id)];
      return next.slice(0, 12);
    });
  };

  // Navigate to spot detail page
  const handleSpotPress = (spot: SpotCardType) => {
    router.push({
      pathname: "/spot-detail",
      params: {
        spotData: JSON.stringify(spot),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Brand row with close button */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>leaflet</Text>
          <Pressable
            style={styles.closeFab}
            onPress={() => router.push("/(tabs)/feed")}
          >
            <Text style={{ fontSize: 18, color: COLORS.text }}>×</Text>
          </Pressable>
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
            onSubmitEditing={handleSubmit}
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
                  {loading ? "Searching…" : error ? "Error" : "Results"}
                </Text>
                {!!debounced && (
                  <Text style={{ color: COLORS.sub }}>{debounced}</Text>
                )}
              </View>

              {error ? (
                <Text style={{ color: "#B91C1C" }}>{error}</Text>
              ) : results.length === 0 && !loading ? (
                <Text style={{ color: COLORS.sub }}>No matches.</Text>
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
                        onPress={onSelectResult}
                      />
                    );
                  }
                })
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: "lowercase",
  },

  searchBarContainer: {
    marginBottom: 20,
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
    color: COLORS.text,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.sub,
    marginBottom: 16,
  },
  quickActionsContainer: {
    marginTop: 4,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionPill: {
    backgroundColor: COLORS.chip,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.chipText,
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginTop: 20,
    paddingHorizontal: 16,
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
    backgroundColor: "#2F4A43", // Nice green color
  },

  overlaySearchWrap: {
    marginTop: 20,
    marginHorizontal: 16,
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

  scrollArea: { flex: 1, marginTop: 20, paddingHorizontal: 16 },

  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 8,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  link: { fontSize: 14, fontWeight: "800", color: COLORS.brand },
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
