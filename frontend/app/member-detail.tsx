import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { firestoreService, userService } from "../services/firestore";

const COLORS = {
  bg: "#FFF6EC", // soft cream
  brand: "#2F4A43", // deep green (logo / active)
  chip: "#1F5B4E", // dark teal for buttons
  chipText: "#FFFFFF",
  text: "#222326",
  sub: "#6F7276",
  inputBg: "#F2F4F5",
  border: "#E3E6E8",
  white: "#FFFFFF",
};

interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  handle?: string;
  email?: string;
  bio?: string;
  location?: string;
  profilePhoto?: string;
  totalRankings: number;
  totalSpots: number;
  averageRating: number;
  points: number;
  rank?: number;
  followers?: string[];
  following?: string[];
  followerCount?: number;
  followingCount?: number;
  totalReviews?: number;
  joinedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export default function MemberDetailScreen() {
  const { user } = useAuth();
  const { memberData } = useLocalSearchParams();
  const navigation = useNavigation();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

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
        setLoading(false);
      }
    }
  }, [memberData]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={styles.loadingText}>Loading member...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Member not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Member Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            {member.profilePhoto ? (
              <Image
                source={{ uri: member.profilePhoto }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.displayName}>{member.displayName}</Text>
          {member.handle && <Text style={styles.handle}>@{member.handle}</Text>}

          {member.bio && <Text style={styles.bio}>{member.bio}</Text>}

          {member.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color={COLORS.sub} />
              <Text style={styles.location}>{member.location}</Text>
            </View>
          )}

          <Pressable
            style={[styles.followButton, isFollowing && styles.followingButton]}
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
          </Pressable>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{member.totalRankings}</Text>
              <Text style={styles.statLabel}>Spots</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{member.totalRankings * 5}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{member.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.sub,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.brand,
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.white,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    color: COLORS.sub,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  location: {
    fontSize: 14,
    color: COLORS.sub,
    marginLeft: 4,
  },
  followButton: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  followingButtonText: {
    color: COLORS.text,
  },
  statsSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    marginTop: 60,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.brand,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.sub,
    fontWeight: "500",
  },
  infoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 20,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.sub,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
});
