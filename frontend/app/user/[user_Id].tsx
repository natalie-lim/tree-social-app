// app/user/[user_Id].tsx
import { RankedCard, UserRanking } from "@/components/RankedCard";
import { useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";

/* ---------------- Palette to match Profile.tsx ---------------- */
const PALETTE = {
  bg: "#F7F1E8",
  card: "#FFFFFF",
  text: "#3E3E3E",
  subtext: "#6F7B6F",
  accent: "#6FA076",
  accentDark: "#5C8B64",
  divider: "#E6E0D6",
  externalBg: "#F1EFE9",
};
const AVATAR_URI = "https://i.imgur.com/3GvwNBf.png";

/* ---------------- Firestore types ---------------- */
type UserDoc = {
  userId: string;
  displayName?: string;
  email?: string;
  username?: string;
  profilePhoto?: string | null;
  bio?: string;
  totalSpots?: number;
  totalReviews?: number;
  followerCount?: number;
  followingCount?: number;
  joinedAt?: any;
};
type RankingDoc = {
  userId: string;
  spotId: string;
  spotName?: string;
  spotLocation?: string;
  rating?: number;
  note?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

/* tiny chevron shim */
function IonIcon({
  name,
  size,
  color,
}: {
  name: "chevron-back" | "chevron-forward";
  size: number;
  color: string;
}) {
  return (
    <Text style={{ fontSize: size, color }}>
      {name === "chevron-back" ? "‹" : "›"}
    </Text>
  );
}

/* ---------------- Screen ---------------- */
export default function PublicUserProfile() {
  // route param derived from filename [user_Id].tsx
  const { user_Id } = useLocalSearchParams<{ user_Id: string }>();

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingRanks, setLoadingRanks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<(UserDoc & { _docId: string }) | null>(
    null
  );
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);

  const safeName =
    user?.displayName || user?.username || user?.email || "User";

  /* -------- fetch user by field userId -------- */
  const fetchUser = useCallback(async (uid: string) => {
    setLoadingUser(true);
    setError(null);
    try {
      const uq = query(
        collection(db, "users"),
        where("userId", "==", uid),
        limit(1)
      );
      const snap = await getDocs(uq);
      if (snap.empty) {
        setError("User not found");
        setUser(null);
      } else {
        const d = snap.docs[0];
        setUser({ _docId: d.id, ...(d.data() as UserDoc) });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load user");
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  /* -------- fetch rankings; retry without orderBy if index missing -------- */
  const fetchRanks = useCallback(async (uid: string) => {
    setLoadingRanks(true);
    try {
      let rq = query(
        collection(db, "rankings"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      let rqs;
      try {
        rqs = await getDocs(rq);
      } catch (err: any) {
        // Common: Firestore needs composite index (userId + createdAt)
        if (err?.code === "failed-precondition") {
          rq = query(collection(db, "rankings"), where("userId", "==", uid), limit(20));
          rqs = await getDocs(rq);
        } else {
          throw err;
        }
      }

      const rows: (RankingDoc & { id: string })[] = rqs.docs.map((d) => ({
        id: d.id,
        ...(d.data() as RankingDoc),
      }));

      const rankings: UserRanking[] = rows.map((r) => ({
        rankingId: r.id,
        spotId: r.spotId,
        spotName: r.spotName || "Unnamed spot",
        spotLocation: r.spotLocation || "",
        rating: r.rating ?? 0,
        note: r.note ?? "",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt ?? r.createdAt,
        spotData: null, // hydrate later if you fetch full spots
      }));

      setUserRankings(rankings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRanks(false);
    }
  }, []);

  useEffect(() => {
    if (!user_Id) return;
    const uid = String(user_Id);
    fetchUser(uid);
    fetchRanks(uid);
  }, [user_Id, fetchUser, fetchRanks]);

  /* -------- helpers -------- */
  const formatJoinDate = (ts: any) => {
    if (!ts) return "joined recently";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return `joined ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  };

  /* -------- UI states -------- */
  if (!user_Id) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user provided.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error ?? "User not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Brand header */}
        <View style={styles.brandRow}>
          <Text style={styles.brandLogo}>🌿</Text>
          <Text style={styles.brandName}>Leaflet</Text>
        </View>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <IonIcon name="chevron-back" size={20} color="#374151" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: user.profilePhoto || AVATAR_URI }}
            style={styles.avatar}
          />
        </View>

        {/* Handle + joined */}
        <View style={styles.centerWrap}>
          <Text style={styles.handle}>@{safeName}</Text>
          <Text style={styles.joined}>{formatJoinDate(user.joinedAt)}</Text>
        </View>

        {/* Public actions (placeholder) */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.ghostButton]}>
            <Text style={styles.ghostButtonText}>follow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ghostButton]}>
            <Text style={styles.ghostButtonText}>message</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem label="followers" value={user.followerCount ?? 0} />
          <StatItem label="following" value={user.followingCount ?? 0} />
          <StatItem label="spots visited" value={user.totalSpots ?? 0} />
        </View>

        {/* Lists section */}
        <View style={styles.section}>
          <ListRow
            icon="✔︎"
            label="Been"
            value={userRankings.length}
            onPress={() =>
              router.push({
                pathname: "/user-rankings",
                params: { userId: user.userId, userName: safeName },
              })
            }
          />
          <View style={styles.divider} />
          <ListRow icon="⭐" label="Reviews" value={user.totalReviews ?? 0} />
        </View>

        {/* Recent Rankings using RankedCard (matches Profile.tsx) */}
        <View style={styles.rankingsSection}>
          <Text style={styles.rankingsSectionTitle}>Recent Rankings</Text>
          {loadingRanks ? (
            <ActivityIndicator />
          ) : userRankings.length ? (
            <View style={styles.rankingsList}>
              {userRankings.slice(0, 3).map((ranking) => (
                <RankedCard
                  key={ranking.rankingId}
                  ranking={ranking}
                  style={styles.rankingCard}
                  onPress={(rk) => {
                    // Navigate with spotData if you later hydrate it; otherwise provide a minimal fallback
                    router.push({
                      pathname: "/spot-detail",
                      params: {
                        spotData: JSON.stringify(
                          rk.spotData ?? {
                            id: rk.spotId,
                            name: rk.spotName,
                            description: rk.note || "No description available",
                            category: "No category",
                            location: {
                              address: rk.spotLocation,
                              coordinates: { latitude: 0, longitude: 0 },
                            },
                            photos: [],
                            amenities: [],
                            averageRating: rk.rating,
                            reviewCount: 1,
                            totalRatings: 1,
                            bestTimeToVisit: [],
                            difficulty: "varies",
                            distance: "",
                            duration: "",
                            elevation: "",
                            isVerified: false,
                            npsCode: "",
                            website: "",
                            tags: [],
                            createdAt: rk.createdAt || new Date(),
                            createdBy: user.userId,
                            source: "USER_ADDED",
                            updatedAt: rk.updatedAt || new Date(),
                          }
                        ),
                      },
                    });
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noRankingsContainer}>
              <Text style={styles.noRankingsText}>No rankings yet</Text>
              <Text style={styles.noRankingsSubtext}>
                When {safeName} visits and rates spots, they’ll show up here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------- Minor shared UI bits -------------- */
function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function ListRow({
  icon = "✓",
  label,
  value,
  onPress,
}: {
  icon?: string;
  label: string;
  value?: string | number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value !== undefined ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---------------- Styles (mirrors Profile.tsx) ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingBottom: 40 },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  brandLogo: { fontSize: 25, marginRight: 8 },
  brandName: {
    fontSize: 25,
    fontWeight: "700",
    color: "#7DA384",
    letterSpacing: 0.3,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#424242" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PALETTE.divider,
  },

  avatarWrap: { alignItems: "center", marginTop: 8 },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#EEE",
  },

  centerWrap: { alignItems: "center", marginTop: 12 },
  handle: { fontSize: 22, fontWeight: "700", color: "#424242" },
  joined: {
    fontSize: 16,
    color: PALETTE.subtext,
    marginTop: 4,
    textTransform: "lowercase",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 20,
  },
  ghostButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DED7CB",
    backgroundColor: "#F8F4EE",
  },
  ghostButtonText: {
    color: "#6B6B6B",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 18,
    paddingHorizontal: 12,
  },
  statItem: { alignItems: "center", minWidth: 90 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#3E3E3E" },
  statLabel: {
    fontSize: 13,
    color: "#6E6E6E",
    marginTop: 2,
    textAlign: "center",
  },

  section: {
    marginTop: 18,
    backgroundColor: "#F8F4EE",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: PALETTE.divider,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 12,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowIcon: { fontSize: 18, width: 26, textAlign: "center", color: "#5E5E5E" },
  rowLabel: { fontSize: 16, color: "#2F2F2F", fontWeight: "700" },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowValue: {
    fontSize: 16,
    color: "#4B4B4B",
    marginRight: 8,
    fontWeight: "700",
  },
  chevron: { fontSize: 24, color: "#9B9B9B", marginTop: -2 },

  divider: { height: 1, backgroundColor: PALETTE.divider, marginLeft: 16 },

  rankingsSection: {
    marginTop: 20,
    marginHorizontal: 12,
  },
  rankingsSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 12,
  },
  rankingsList: { gap: 12 },
  rankingCard: { marginBottom: 0 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PALETTE.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.subtext,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PALETTE.bg,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: PALETTE.subtext,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: PALETTE.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  noRankingsContainer: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  noRankingsText: {
    fontSize: 16,
    fontWeight: "600",
    color: PALETTE.text,
    marginBottom: 4,
  },
  noRankingsSubtext: {
    fontSize: 14,
    color: PALETTE.subtext,
    textAlign: "center",
    lineHeight: 18,
  },
});
