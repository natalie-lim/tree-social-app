// app/(tabs)/leaderboard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { firestoreService } from "../../services/firestore";

// ---------- THEME ----------
const THEME = {
  bg: "#FFFAF0", // warm cream
  surface: "#FFF6EC", // light cream
  card: "#EEF4EE", // soft desaturated green
  cardAlt: "#E8EFE8",
  text: "#2F2A2A",
  subtext: "#5F5A5A",
  primary: "#6FA076",
  primaryAlt: "#5B8963",
  divider: "rgba(47,42,42,0.08)",
  gold: "#F2C94C",
  silver: "#C1C7CF",
  bronze: "#D0A17A",
};

// ---------- TYPES ----------
interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  totalSpots: number;
  totalReviews: number;
  averageRating: number;
}

// ---------- PODIUM HEIGHTS (rank-specific) ----------
const PODIUM_MAX = 180;
const PODIUM_MIN_GOLD = 160;
const PODIUM_MIN_SILVER = 145;
const PODIUM_MIN_BRONZE = 130;
// 1 = linear; <1 boosts mids, >1 compresses mids
const EASE_EXPONENT = 0.7;

// scores expected in rank order: [gold, silver, bronze]
function computePodiumHeightsRanked(scores: number[]): number[] {
  const vals = scores.map((s) => (Number.isFinite(s) ? s : 0));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const floors = [PODIUM_MIN_GOLD, PODIUM_MIN_SILVER, PODIUM_MIN_BRONZE];

  if (!isFinite(min) || !isFinite(max) || max === min) return floors;

  return vals.map((s, i) => {
    let t = (s - min) / (max - min); // 0..1
    t = Math.pow(t, EASE_EXPONENT);
    const floor = floors[i] ?? PODIUM_MIN_BRONZE;
    const h = floor + t * (PODIUM_MAX - floor);
    return Math.max(floor, Math.min(PODIUM_MAX, h));
  });
}

// ---------- SCREEN ----------
export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const allUsers = await firestoreService.query("users", []);
      const normalized: LeaderboardUser[] = (allUsers ?? []).map(
        (user: any) => {
          const display = (user?.displayName ?? "").trim();
          const safeName = display.length ? display : "Anonymous";
          const spots = Number(user?.totalSpots ?? 0) || 0;
          const reviews = Number(user?.totalReviews ?? 0) || 0;
          const avg = Number(user?.averageRating ?? 0) || 0;
          const points = Number(user?.points ?? 0) || 0;
          return {
            id: String(user?.id ?? safeName),
            name: safeName,
            points: points,
            totalSpots: spots,
            totalReviews: reviews,
            averageRating: avg,
          };
        }
      );
      normalized.sort((a, b) => b.points - a.points);
      setUsers(normalized);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const podium = useMemo(() => users.slice(0, 3), [users]);

  // Heights for [gold, silver, bronze]
  const [hGold, hSilver, hBronze] = useMemo(() => {
    return computePodiumHeightsRanked([
      podium[0]?.points ?? 0,
      podium[1]?.points ?? 0,
      podium[2]?.points ?? 0,
    ]);
  }, [podium]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading leaderboard…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 12 }} />
          <Text onPress={fetchLeaderboard} style={styles.link}>
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  if (!users.length) {
    return (
      <View style={styles.screen}>
        <Text style={styles.header}>leaderboard</Text>
        <View style={[styles.centerBox, { paddingTop: 40 }]}>
          <Ionicons name="podium-outline" size={40} color={THEME.primary} />
          <Text style={[styles.errorTitle, { marginTop: 8 }]}>
            No entries yet
          </Text>
          <Text style={styles.subtleText}>
            Be the first to add a spot or leave a review.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>leaderboard</Text>

      {/* ---- PODIUM ---- */}
      <View style={styles.podiumWrap}>
        <View style={styles.podiumBg} />
        <View style={styles.podiumRow}>
          {/* NOTE: Render order is 2nd, 1st, 3rd visually */}
          <PodiumBlock
            rank={2}
            name={podium[1]?.name ?? "-"}
            points={podium[1]?.points ?? 0}
            height={hSilver}
            color={THEME.silver}
          />
          <PodiumBlock
            rank={1}
            name={podium[0]?.name ?? "-"}
            points={podium[0]?.points ?? 0}
            height={hGold}
            color={THEME.gold}
            crowned
          />
          <PodiumBlock
            rank={3}
            name={podium[2]?.name ?? "-"}
            points={podium[2]?.points ?? 0}
            height={hBronze}
            color={THEME.bronze}
          />
        </View>
      </View>

      {/* ---- LIST ---- */}
      <FlatList
        data={users}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
          />
        }
        renderItem={({ item, index }) => (
          <RowCard
            rank={index + 1}
            name={item.name}
            points={item.points}
            spots={item.totalSpots}
            reviews={item.totalReviews}
            avg={item.averageRating}
          />
        )}
        ListHeaderComponent={<View style={{ height: 12 }} />}
        ListFooterComponent={<View style={{ height: 12 }} />}
      />
    </View>
  );
}

// ---------- PODIUM COLUMN ----------
function PodiumBlock({
  rank,
  name,
  points,
  height,
  color,
  crowned,
}: {
  rank: 1 | 2 | 3;
  name: string;
  points: number;
  height: number;
  color: string;
  crowned?: boolean;
}) {
  const initial = (name?.trim?.() || "?").charAt(0).toUpperCase();
  const anim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: height,
      tension: 120,
      friction: 14,
      useNativeDriver: false, // height anim cannot use native driver
    }).start();
  }, [height]);

  return (
    <Animated.View style={[styles.podiumCol, { height: anim }]}>
      {crowned ? (
        <Ionicons name="trophy" size={22} style={[styles.crown, { color }]} />
      ) : (
        <View style={[styles.medal, { backgroundColor: color }]} />
      )}
      <View style={[styles.badge, { backgroundColor: THEME.primary }]}>
        <Text style={styles.badgeInitial}>{initial}</Text>
      </View>
      <Text
        style={styles.podiumName}
        numberOfLines={1}
        accessibilityLabel={`Rank ${rank} ${name}`}
      >
        {name}
      </Text>
      <Text style={styles.podiumPoints}>{points} pts</Text>
    </Animated.View>
  );
}

// ---------- ROW CARD ----------
function RowCard({
  rank,
  name,
  points,
  spots,
  reviews,
  avg,
}: {
  rank: number;
  name: string;
  points: number;
  spots: number;
  reviews: number;
  avg: number;
}) {
  const initial = (name?.trim?.() || "?").charAt(0).toUpperCase();
  return (
    <View
      style={styles.rowCard}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Rank ${rank}, ${name}, ${points} points`}
    >
      <Text style={styles.rank}>{rank}</Text>

      <View style={styles.rowMain}>
        <View style={styles.smallBadge}>
          <Text style={styles.smallBadgeText}>{initial}</Text>
        </View>
        <Text style={styles.rowName} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <View style={styles.kpis}>
        <Text style={styles.kpiText}>{points}</Text>
        <View style={styles.kpiChip}>
          <Ionicons name="map" size={12} color={THEME.primaryAlt} />
          <Text style={styles.kpiChipText}>{spots}</Text>
        </View>
        <View style={styles.kpiChip}>
          <Ionicons name="chatbubble" size={12} color={THEME.primaryAlt} />
          <Text style={styles.kpiChipText}>{reviews}</Text>
        </View>
        <View style={styles.kpiChip}>
          <Ionicons name="star" size={12} color={THEME.primaryAlt} />
          <Text style={styles.kpiChipText}>{avg.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingHorizontal: 16,
    paddingTop: 56,
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: THEME.text,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "lowercase",
  },

  // Podium
  podiumWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
  },
  podiumBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.cardAlt,
    borderRadius: 20,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
  },
  podiumCol: {
    flex: 1,
    backgroundColor: THEME.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  crown: {
    position: "absolute",
    top: 6,
  },
  medal: {
    position: "absolute",
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeInitial: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  podiumName: {
    color: THEME.text,
    fontWeight: "700",
    fontSize: 14,
    marginTop: 2,
    maxWidth: 120,
  },
  podiumPoints: {
    color: THEME.subtext,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },

  // Rows
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.divider,
  },
  rank: {
    width: 28,
    textAlign: "center",
    fontWeight: "900",
    color: THEME.primary,
    fontSize: 18,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  smallBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  rowName: {
    color: THEME.text,
    fontWeight: "700",
    fontSize: 16,
    flexShrink: 1,
  },
  kpis: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  kpiText: {
    color: THEME.text,
    fontWeight: "900",
    fontSize: 16,
    marginRight: 4,
  },
  kpiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.divider,
  },
  kpiChipText: {
    color: THEME.primaryAlt,
    fontWeight: "800",
    fontSize: 12,
  },

  // States
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: THEME.subtext,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.text,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: THEME.subtext,
    textAlign: "center",
  },
  subtleText: {
    fontSize: 14,
    color: THEME.subtext,
    marginTop: 4,
    textAlign: "center",
  },
  link: {
    color: THEME.primary,
    fontWeight: "800",
    fontSize: 14,
  },
});
