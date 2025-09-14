// Profile.tsx
import { RankedCard, UserRanking } from "@/components/RankedCard";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CuteLoading } from "../../components/CuteLoading";
import { useAuth } from "../../contexts/AuthContext";
import { useRefresh } from "../../contexts/RefreshContext";
import { firestoreService } from "../../services/firestore";
import { userService } from "../../services/natureApp";

type Stat = { label: string; value: string | number };
type ListRowProps = {
  label: string;
  value?: string | number;
  onPress?: () => void;
};

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  profilePhoto?: string;
  photoURL?: string;
  joinedAt: any;
  followerCount: number;
  followingCount: number;
  totalSpots: number;
  totalReviews: number;
  averageRating: number;
  rankings?: UserRanking[];
  totalRankings?: number;
}

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

// -------- Letter Avatar --------
const AVATAR_COLORS = [
  "#6FA076", "#5C8B64", "#8BAF8F", "#7DA384", "#4E7F59", "#9DC3A4", "#678D73",
  "#5B9A7A", "#7A9E7E", "#86B78A"
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function firstLetter(name?: string) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const match = trimmed.match(/\p{L}|\p{N}/u);
  return (match ? match[0] : trimmed[0]).toUpperCase();
}

const LetterAvatar = ({ name, size = 48 }: { name?: string; size?: number }) => {
  const initial = firstLetter(name);
  const bg = colorForName(name ?? "user");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
      }}
      accessibilityRole="image"
      accessibilityLabel={`${name ?? "user"} avatar`}
    >
      <Text
        style={{
          color: "white",
          fontWeight: "800",
          fontSize: Math.max(14, size * 0.44),
          includeFontPadding: false,
          textAlignVertical: "center",
        }}
      >
        {initial}
      </Text>
    </View>
  );
};
// --------------------------------

const StatItem = ({ label, value }: Stat) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ListRow = ({ label, value, onPress }: ListRowProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
    <View style={styles.rowLeft}>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      {value !== undefined ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { shouldRefreshProfile, clearRefreshFlag } = useRefresh();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch full ranking documents (by ID from userProfile.rankings)
   * and map them to UserRanking without referencing undefined vars.
   */
  const fetchUserRankings = async (profile: UserProfile) => {
    if (!profile?.rankings?.length) {
      setUserRankings([]);
      return;
    }

    try {
      setProfileLoading(true);
      const rankingIds = profile.rankings.map((r) => r.rankingId);
      const fullRankings: UserRanking[] = [];

      for (const rankingId of rankingIds) {
        try {
          const docAny = (await firestoreService.read("rankings", rankingId)) as any;
          if (docAny) {
            const r: UserRanking = {
              rankingId: docAny.id || rankingId,
              spotId: docAny.spotId,
              spotName: docAny.spotName || "",
              spotLocation: docAny.spotLocation || "",
              rating: docAny.rating || 0,
              note: docAny.note || "",
              createdAt: docAny.createdAt,
              updatedAt: docAny.updatedAt,
              // we will hydrate on-demand when tapping the card
              spotData: null,
            };
            fullRankings.push(r);
          }
        } catch (err) {
          // Fallback from the lightweight ranking stored on the profile
          const pr = profile.rankings.find((x) => x.rankingId === rankingId);
          if (pr) {
            fullRankings.push({
              rankingId: pr.rankingId,
              spotId: pr.spotId,
              spotName: pr.spotName,
              spotLocation: "Location not available",
              rating: pr.rating,
              note: "No notes available",
              createdAt: pr.createdAt,
              updatedAt: pr.createdAt,
              spotData: null,
            });
          }
        }
      }

      // newest first
      fullRankings.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });

      setUserRankings(fullRankings);
    } catch (err) {
      console.error("Error fetching user rankings:", err);
      setError("Failed to load rankings");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      try {
        setProfileLoading(true);
        await userService.updateUserStats(user.uid);
        const profile = (await userService.getUserProfile(user.uid)) as UserProfile;
        setUserProfile(profile);
        setError(null);
        await fetchUserRankings(profile);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (shouldRefreshProfile && user) {
      refreshProfile();
      clearRefreshFlag();
    }
  }, [shouldRefreshProfile, user]);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      setProfileLoading(true);
      await userService.updateUserStats(user.uid);
      const profile = (await userService.getUserProfile(user.uid)) as UserProfile;
      setUserProfile(profile);
      await fetchUserRankings(profile);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * Lazy spot fetch for navigation – keeps list fast and simple.
   */
  const fetchSpotDataOnDemand = async (ranking: UserRanking) => {
    if (ranking.spotData) return ranking.spotData;

    if (!ranking.spotId) {
      // minimal fallback
      return {
        id: ranking.spotId,
        name: ranking.spotName,
        description: ranking.note || "No description available",
        category: "No category",
        location: {
          address: ranking.spotLocation,
          coordinates: { latitude: 0, longitude: 0 },
        },
        photos: [],
        amenities: [],
        averageRating: ranking.rating,
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
        createdAt: ranking.createdAt || new Date(),
        createdBy: user?.uid || "",
        source: "USER_ADDED",
        updatedAt: ranking.updatedAt || new Date(),
      };
    }

    try {
      const spotAny = (await firestoreService.read("spots", ranking.spotId)) as any;
      if (spotAny) {
        return {
          id: spotAny.id || ranking.spotId,
          name: spotAny.name || ranking.spotName || "",
          description: spotAny.description || "No description available",
          category: spotAny.category || "No category",
          location:
            spotAny.location || {
              address: ranking.spotLocation || "Unknown Location",
              coordinates: spotAny.location?.coordinates || { latitude: 0, longitude: 0 },
            },
          photos: spotAny.photos || [],
          amenities: spotAny.amenities || [],
          averageRating: spotAny.averageRating || 0,
          reviewCount: spotAny.reviewCount || 0,
          totalRatings: spotAny.totalRatings || 0,
          bestTimeToVisit: spotAny.bestTimeToVisit || [],
          difficulty: spotAny.difficulty || "varies",
          distance: spotAny.distance || "",
          duration: spotAny.duration || "",
          elevation: spotAny.elevation || "",
          isVerified: spotAny.isVerified || false,
          npsCode: spotAny.npsCode || "",
          website: spotAny.website || "",
          tags: spotAny.tags || [],
          createdAt: spotAny.createdAt || new Date(),
          createdBy: spotAny.createdBy || "",
          source: spotAny.source || "USER_ADDED",
          updatedAt: spotAny.updatedAt || new Date(),
        };
      }
    } catch (err) {
      console.warn(`Could not fetch spot ${ranking.spotId}:`, err);
    }

    // last-resort fallback
    return {
      id: ranking.spotId,
      name: ranking.spotName,
      description: ranking.note || "No description available",
      category: "No category",
      location: {
        address: ranking.spotLocation,
        coordinates: { latitude: 0, longitude: 0 },
      },
      photos: [],
      amenities: [],
      averageRating: ranking.rating,
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
      createdAt: ranking.createdAt || new Date(),
      createdBy: user?.uid || "",
      source: "USER_ADDED",
      updatedAt: ranking.updatedAt || new Date(),
    };
  };

  const formatJoinDate = (timestamp: any) => {
    if (!timestamp) return "joined recently";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `joined ${date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  };

  const logout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/frontpage");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <CuteLoading message="Loading your profile..." size="medium" showMessage />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please log in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={refreshProfile}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = userProfile?.displayName || user?.displayName || "User";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header brand */}
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>🌿</Text>
            <Text style={styles.brandName}>Leaflet</Text>
          </View>

          {/* Avatar (Letter-based) */}
          <View style={styles.avatarWrap}>
            <LetterAvatar name={displayName} size={124} />
          </View>

          {/* Handle + joined */}
          <View style={styles.centerWrap}>
            <Text style={styles.handle}>@{displayName}</Text>
            <Text style={styles.joined}>
              {userProfile?.joinedAt ? formatJoinDate(userProfile.joinedAt) : "joined recently"}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.ghostButton]} onPress={refreshProfile}>
              <Text style={styles.ghostButtonText}>refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ghostButton]}>
              <Text style={styles.ghostButtonText}>edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostButton, styles.logoutGhostButton]}
              onPress={logout}
            >
              <Text style={[styles.ghostButtonText, styles.logoutGhostButtonText]}>
                logout
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="followers" value={userProfile?.followerCount || 0} />
            <StatItem label="following" value={userProfile?.followingCount || 0} />
            <StatItem label="spots visited" value={userProfile?.totalSpots || 0} />
          </View>

          {/* Lists */}
          <View style={styles.section}>
            <ListRow
              label="Been"
              value={userProfile?.totalRankings || 0}
              onPress={() => {
                router.push({
                  pathname: "/user-rankings",
                  params: {
                    userId: user?.uid,
                    userName: displayName,
                  },
                });
              }}
            />
            <View style={styles.divider} />
            <ListRow label="Reviews" value={userProfile?.totalReviews || 0} />
            <View style={styles.divider} />
            <ListRow
              label="Average Rating"
              value={
                userProfile?.averageRating
                  ? userProfile.averageRating.toFixed(1)
                  : "0.0"
              }
            />
          </View>

          {/* User's Rankings */}
          <View style={styles.rankingsSection}>
            <ThemedText style={styles.rankingsSectionTitle}>
              Your Recent Rankings
            </ThemedText>
            {userRankings.length > 0 ? (
              <View style={styles.rankingsList}>
                {userRankings.slice(0, 3).map((ranking) => (
                  <RankedCard
                    key={ranking.rankingId}
                    ranking={ranking}
                    onPress={async (r) => {
                      const spotData = await fetchSpotDataOnDemand(r);
                      router.push({
                        pathname: "/spot-detail",
                        params: { spotData: JSON.stringify(spotData) },
                      });
                    }}
                    style={styles.rankingCard}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noRankingsContainer}>
                <Text style={styles.noRankingsText}>No rankings yet</Text>
                <Text style={styles.noRankingsSubtext}>
                  Visit spots and rate them to see your rankings here
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  root: { flex: 1, backgroundColor: PALETTE.bg },
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

  avatarWrap: { alignItems: "center", marginTop: 8 },
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: "#EEE" },

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
  logoutGhostButton: {
    backgroundColor: "#FFE6E6",
    borderColor: "#FFB3B3",
  },
  logoutGhostButtonText: {
    color: "#D63031",
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
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
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

  // Rankings
  rankingsSection: { marginTop: 20, marginHorizontal: 12 },
  rankingsSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 12,
  },
  rankingsList: { gap: 12 },
  rankingCard: { marginBottom: 0 },

  // Empty state
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

  // Errors / loading (shared)
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
  errorButtonContainer: { flexDirection: "row", gap: 12 },
  retryButton: {
    backgroundColor: PALETTE.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
