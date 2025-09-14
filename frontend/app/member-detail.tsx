import { RankedCard, UserRanking } from "@/components/RankedCard";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { firestoreService } from "../services/firestore";
import { userService } from "../services/natureApp";

type Stat = { label: string; value: string | number };
type ListRowProps = {
  label: string;
  value?: string | number;
  onPress?: () => void;
};

interface MemberProfile {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  handle?: string;
  bio?: string;
  location?: string;
  profilePhoto?: string;
  joinedAt: any;
  followerCount: number;
  followingCount: number;
  totalSpots: number;
  totalReviews: number;
  totalRankings: number;
  averageRating: number;
  averageRanking: number;
  rankings?: UserRanking[];
  followers?: string[];
  following?: string[];
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
  green: "#749C75",
};

// -------- Letter Avatar --------
const AVATAR_COLORS = [
  "#6FA076",
  "#5C8B64",
  "#8BAF8F",
  "#7DA384",
  "#4E7F59",
  "#9DC3A4",
  "#678D73",
  "#5B9A7A",
  "#7A9E7E",
  "#86B78A",
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

const LetterAvatar = ({
  name,
  size = 48,
}: {
  name?: string;
  size?: number;
}) => {
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
      {value !== undefined ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

export default function MemberDetailScreen() {
  const { user } = useAuth();
  const { memberData } = useLocalSearchParams();
  const navigation = useNavigation();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [memberRankings, setMemberRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (memberData) {
      try {
        const parsedMember = JSON.parse(memberData as string);
        setMember(parsedMember);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing member data:", error);
        setError("Failed to load member profile");
        setLoading(false);
      }
    }
  }, [memberData]);

  // Check if current user is following this member
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (user && member) {
        try {
          const currentUserDoc = (await userService.getUserProfile(
            user.uid
          )) as any;
          if (currentUserDoc && currentUserDoc.following) {
            const isCurrentlyFollowing = currentUserDoc.following.includes(
              member.userId
            );
            setIsFollowing(isCurrentlyFollowing);
          }
        } catch (error) {
          console.error("Error checking following status:", error);
        }
      }
    };

    checkFollowingStatus();
  }, [user, member]);

  // Fetch member's rankings (only once when member is first loaded)
  useEffect(() => {
    const fetchMemberRankings = async () => {
      if (!member) return;

      try {
        setRankingsLoading(true);
        // Get the member's full profile to access rankings
        const fullMemberProfile = (await userService.getUserProfile(
          member.userId
        )) as any;
        if (fullMemberProfile?.rankings?.length) {
          const rankingIds = fullMemberProfile.rankings.map(
            (r: any) => r.rankingId
          );
          const fullRankings: UserRanking[] = [];

          for (const rankingId of rankingIds) {
            try {
              const docAny = (await firestoreService.read(
                "rankings",
                rankingId
              )) as any;
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
                  spotData: null,
                };
                fullRankings.push(r);
              }
            } catch (err) {
              // Fallback from the lightweight ranking stored on the profile
              const pr = fullMemberProfile.rankings.find(
                (x: any) => x.rankingId === rankingId
              );
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

          // Sort newest first
          fullRankings.sort((a, b) => {
            const aDate = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          });

          setMemberRankings(fullRankings);
        }
      } catch (err) {
        console.error("Error fetching member rankings:", err);
      } finally {
        setRankingsLoading(false);
      }
    };

    fetchMemberRankings();
  }, [member?.userId]); // Only depend on userId, not the entire member object

  const handleFollowPress = async () => {
    if (!user || !member) return;

    // Update UI first for immediate feedback
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    // Update local state immediately
    setMember((prev) =>
      prev
        ? {
            ...prev,
            followerCount: newFollowingState
              ? (prev.followerCount || 0) + 1
              : (prev.followerCount || 0) - 1,
            followers: newFollowingState
              ? [...(prev.followers || []), user.uid]
              : (prev.followers || []).filter(
                  (followerId: string) => followerId !== user.uid
                ),
          }
        : null
    );

    // Then update backend
    try {
      if (newFollowingState) {
        // Follow logic - increment counts
        await firestoreService.update("users", member.id, {
          followerCount: (member.followerCount || 0) + 1,
          followers: [...(member.followers || []), user.uid],
        });

        // Increment followingCount for current user
        const currentUserDoc = (await userService.getUserProfile(
          user.uid
        )) as any;
        if (currentUserDoc) {
          await firestoreService.update("users", currentUserDoc.id, {
            followingCount: (currentUserDoc.followingCount || 0) + 1,
            following: [...(currentUserDoc.following || []), member.userId],
          });
        }
      } else {
        // Unfollow logic - decrement counts
        await firestoreService.update("users", member.id, {
          followerCount: (member.followerCount || 0) - 1,
          followers: (member.followers || []).filter(
            (followerId: string) => followerId !== user.uid
          ),
        });

        // Decrement followingCount for current user
        const currentUserDoc = (await userService.getUserProfile(
          user.uid
        )) as any;
        if (currentUserDoc) {
          await firestoreService.update("users", currentUserDoc.id, {
            followingCount: (currentUserDoc.followingCount || 0) - 1,
            following: (currentUserDoc.following || []).filter(
              (followingId: string) => followingId !== member.userId
            ),
          });
        }
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      // Revert UI changes if backend update fails
      setIsFollowing(!newFollowingState);
      setMember((prev) =>
        prev
          ? {
              ...prev,
              followerCount: newFollowingState
                ? (prev.followerCount || 0) - 1
                : (prev.followerCount || 0) + 1,
              followers: newFollowingState
                ? (prev.followers || []).filter(
                    (followerId: string) => followerId !== user.uid
                  )
                : [...(prev.followers || []), user.uid],
            }
          : null
      );
    }
  };

  const fetchSpotDataOnDemand = async (ranking: UserRanking) => {
    if (ranking.spotData) return ranking.spotData;

    if (!ranking.spotId) {
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
        createdBy: member?.userId || "",
        source: "USER_ADDED",
        updatedAt: ranking.updatedAt || new Date(),
      };
    }

    try {
      const spotAny = (await firestoreService.read(
        "spots",
        ranking.spotId
      )) as any;
      if (spotAny) {
        return {
          id: spotAny.id || ranking.spotId,
          name: spotAny.name || ranking.spotName || "",
          description: spotAny.description || "No description available",
          category: spotAny.category || "No category",
          location: spotAny.location || {
            address: ranking.spotLocation || "Unknown Location",
            coordinates: spotAny.location?.coordinates || {
              latitude: 0,
              longitude: 0,
            },
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
      createdBy: member?.userId || "",
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
          <Text style={styles.loadingText}>Loading member profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Member not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = member.displayName || "User";
  const handle = member.handle || displayName;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* Header with back button */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={PALETTE.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Member Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Avatar (Letter-based) */}
          <View style={styles.avatarWrap}>
            <LetterAvatar name={displayName} size={124} />
          </View>

          {/* Handle + joined */}
          <View style={styles.centerWrap}>
            <Text style={styles.handle}>@{handle}</Text>
            <Text style={styles.joined}>
              {member.joinedAt
                ? formatJoinDate(member.joinedAt)
                : "joined recently"}
            </Text>
          </View>

          {/* Bio */}
          {member.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bio}>{member.bio}</Text>
            </View>
          )}

          {/* Location */}
          {member.location && (
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={16}
                color={PALETTE.subtext}
              />
              <Text style={styles.location}>{member.location}</Text>
            </View>
          )}

          {/* Follow Button */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollowPress}
            >
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="followers" value={member.followerCount || 0} />
            <StatItem label="following" value={member.followingCount || 0} />
            <StatItem label="spots visited" value={member.totalRankings || 0} />
          </View>

          {/* Lists */}
          <View style={styles.section}>
            <ListRow
              label="Been"
              value={member.totalRankings || 0}
              onPress={() => {
                router.push({
                  pathname: "/user-rankings",
                  params: {
                    userId: member.userId,
                    userName: displayName,
                  },
                });
              }}
            />
            <View style={styles.divider} />
          </View>

          {/* Member's Rankings */}
          <View style={styles.rankingsSection}>
            <ThemedText style={styles.rankingsSectionTitle}>
              {displayName}'s Recent Rankings
            </ThemedText>
            {rankingsLoading ? (
              <View style={styles.rankingsLoadingContainer}>
                <ActivityIndicator size="small" color={PALETTE.accent} />
                <Text style={styles.rankingsLoadingText}>
                  Loading rankings...
                </Text>
              </View>
            ) : memberRankings.length > 0 ? (
              <View style={styles.rankingsList}>
                {memberRankings.slice(0, 3).map((ranking) => (
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
                  This member hasn't rated any spots yet
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.subtext,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: PALETTE.subtext,
    textAlign: "center",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: PALETTE.accent,
    fontWeight: "600",
  },

  // Profile content
  avatarWrap: { alignItems: "center", marginTop: 8 },
  centerWrap: { alignItems: "center", marginTop: 12 },
  handle: { fontSize: 22, fontWeight: "700", color: "#424242" },
  joined: {
    fontSize: 16,
    color: PALETTE.subtext,
    marginTop: 4,
    textTransform: "lowercase",
  },

  // Bio and location
  bioContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  bio: {
    fontSize: 16,
    color: PALETTE.text,
    textAlign: "center",
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "center",
  },
  location: {
    fontSize: 14,
    color: PALETTE.subtext,
    marginLeft: 4,
  },

  // Follow button
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  followButton: {
    backgroundColor: PALETTE.green,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: PALETTE.externalBg,
    borderWidth: 1,
    borderColor: PALETTE.divider,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  followingButtonText: {
    color: PALETTE.text,
  },

  // Stats
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

  // Lists
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

  // Loading state
  rankingsLoadingContainer: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  rankingsLoadingText: {
    fontSize: 14,
    color: PALETTE.subtext,
    marginTop: 8,
  },

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
});
