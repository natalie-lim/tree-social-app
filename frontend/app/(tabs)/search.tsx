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
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

// ---- Firestore (v9 modular) ----
import {
  collection,
  getDocs,
  limit as qLimit,
  orderBy,
  query as q,
  startAt,
  endAt,
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

type Spot = { id: string; name: string; name_lower?: string; city?: string; category?: string };
type UserLite = { id: string; handle?: string; username_lower?: string; displayName?: string; rank?: number; followers?: number };

type ResultItem = {
  id: string;
  title: string;
  subtitle?: string;
};

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
            <Pressable style={styles.closeFab} onPress={() => setOverlayOpen(false)}>
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
                <Pressable style={styles.tab} onPress={() => setTab("locations")}>
                  <Text style={[styles.tabLabel, tab === "locations" && styles.tabLabelActive]}>
                    Locations
                  </Text>
                  <View
                    style={[styles.tabUnderline, tab === "locations" && styles.tabUnderlineActive]}
                  />
                </Pressable>

                <Pressable style={styles.tab} onPress={() => setTab("members")}>
                  <Text style={[styles.tabLabel, tab === "members" && styles.tabLabelActive]}>
                    Members
                  </Text>
                  <View
                    style={[styles.tabUnderline, tab === "members" && styles.tabUnderlineActive]}
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
                  placeholder={tab === "locations" ? "Search name or place…" : "Search name or handle…"}
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
                          <RecentPill name={r.title} handle={r.subtitle?.replace("@", "") || ""} />
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
                        <ResultRow title="Cafe Lumen" subtitle="Cambridge • Coffee" onPress={onSelectResult} />
                        <ResultRow title="Shiso Kitchen" subtitle="Somerville • Japanese" onPress={onSelectResult} />
                        <ResultRow title="Riverview Diner" subtitle="Boston • American" onPress={onSelectResult} />
                      </>
                    ) : (
                      <>
                        <ResultRow title="@charlie" subtitle="Rank #12 • 240 followers" onPress={onSelectResult} />
                        <ResultRow title="@mia" subtitle="Rank #33 • 120 followers" onPress={onSelectResult} />
                        <ResultRow title="@alex" subtitle="Rank #58 • 90 followers" onPress={onSelectResult} />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        {loading ? "Searching…" : error ? "Error" : "Results"}
                      </Text>
                      {!!debounced && <Text style={{ color: COLORS.subtext }}>{debounced}</Text>}
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
        {/* ================= END OVERLAY ================= */}
      </ThemedView>
    </SafeAreaView>
  );
}

/* ---------- Helpers ---------- */

// Debounce hook (no external deps)
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
  return s
    .normalize("NFKD")
    // @ts-ignore — Unicode property escapes supported in Hermes/JSI RN 0.72+
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Firestore prefix search
 * - locations -> collection("spots"), orderBy("name_lower")
 * - members   -> collection("users"), orderBy("username_lower")
 * Returns a unified ResultItem[]
 *
 * NOTE: Ensure you have composite indexes if you add extra where() later.
 */
async function searchFirestore(tab: TabKey, queryLower: string): Promise<ResultItem[]> {
  if (!queryLower) return [];

  if (tab === "locations") {
    const ref = collection(db, "spots");
    const queryRef = q(
      ref,
      orderBy("name_lower"),
      startAt(queryLower),
      endAt(queryLower + "\uf8ff"),
      qLimit(20)
    );
    const snap = await getDocs(queryRef);
    const items: ResultItem[] = snap.docs.map((d) => {
      const data = d.data() as Spot;
      const subtitle = buildLocationSubtitle(data);
      return { id: d.id, title: data.name || "(untitled)", subtitle };
    });
    return items;
  } else {
    const ref = collection(db, "users");
    const queryRef = q(
      ref,
      orderBy("username_lower"),
      startAt(queryLower),
      endAt(queryLower + "\uf8ff"),
      qLimit(20)
    );
    const snap = await getDocs(queryRef);
    const items: ResultItem[] = snap.docs.map((d) => {
      const u = d.data() as UserLite;
      const title = u.handle ? `@${u.handle}` : u.displayName || "(user)";
      const subtitle =
        u.displayName && u.handle
          ? `${u.displayName}`
          : u.followers || u.rank
          ? `Rank #${u.rank ?? "-"} • ${u.followers ?? 0} followers`
          : undefined;
      return { id: d.id, title, subtitle };
    });
    return items;
  }
}

function buildLocationSubtitle(s: Spot) {
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
  const item = useMemo(() => ({ id: title, title, subtitle }), [title, subtitle]);
  return (
    <Pressable onPress={() => onPress?.(item)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
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
      <Text style={recentStyles.name} numberOfLines={1}>{name}</Text>
      <Text style={recentStyles.handle} numberOfLines={1}>{handle}</Text>
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
    top: 0, right: 0, left: 0, bottom: 0,
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
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#E5E7EB",
    marginBottom: 6,
  },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  handle: { fontSize: 12, color: "#6B7280" },
  closeDot: {
    position: "absolute",
    top: 0, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
});
