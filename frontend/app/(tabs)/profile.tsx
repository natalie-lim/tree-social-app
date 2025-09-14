// Profile.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { userService } from "../../services/natureApp";

type Stat = { label: string; value: string | number };
type ListRowProps = { icon?: string; label: string; value?: string | number; onPress?: () => void };

const PALETTE = {
  bg: "#F7F1E8",            // creamy background
  card: "#FFFFFF",
  text: "#3E3E3E",
  subtext: "#6F7B6F",       // leaf green-ish for secondary
  accent: "#6FA076",        // leafy green
  accentDark: "#5C8B64",
  divider: "#E6E0D6",
  externalBg: "#F1EFE9",    // new: muted tan/gray for external likes/comments
};

const AVATAR_URI =
  "https://i.imgur.com/3GvwNBf.png"; // placeholder
const PLACE_URI =
  "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?q=80&w=1200&auto=format&fit=crop";

const StatItem = ({ label, value }: Stat) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ListRow = ({ icon = "✓", label, value, onPress }: ListRowProps) => (
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

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        
        // First, update user stats from actual data
        await userService.updateUserStats(user.uid);
        
        // Then fetch the updated profile
        const profile = await userService.getUserProfile(user.uid);
        console.log('Fetched user profile:', profile); // Debug log
        setUserProfile(profile);
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Add refresh functionality
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      setProfileLoading(true);
      
      // Update user stats from actual data
      await userService.updateUserStats(user.uid);
      
      // Then fetch the updated profile
      const profile = await userService.getUserProfile(user.uid);
      console.log('Refreshed user profile:', profile); // Debug log
      setUserProfile(profile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const formatJoinDate = (timestamp) => {
    if (!timestamp) return 'joined recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  if (authLoading || profileLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header brand */}
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>🌿</Text>
            <Text style={styles.brandName}>Leaflet</Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Image 
              source={{ 
                uri: userProfile?.profilePhoto || user?.photoURL || AVATAR_URI 
              }} 
              style={styles.avatar} 
            />
          </View>

          {/* Handle + joined */}
          <View style={styles.centerWrap}>
            <Text style={styles.handle}>@{userProfile?.displayName || user?.displayName || 'user'}</Text>
            <Text style={styles.joined}>
              {userProfile?.joinedAt ? formatJoinDate(userProfile.joinedAt) : 'joined recently'}
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
            <TouchableOpacity style={[styles.ghostButton]}>
              <Text style={styles.ghostButtonText}>share profile</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="followers" value={userProfile?.followerCount || 0} />
            <StatItem label="following" value={userProfile?.followingCount || 0} />
            <StatItem label="spots visited" value={userProfile?.totalSpots || 0} />
          </View>

          {/* Debug info - remove this in production */}
          {__DEV__ && userProfile && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>Debug: totalSpots={userProfile.totalSpots}, totalReviews={userProfile.totalReviews}</Text>
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={async () => {
                  // Create a test activity (spot visit)
                  await userService.incrementUserSpots(user.uid);
                  // Create a test review
                  await userService.incrementUserReviews(user.uid);
                  // Refresh profile
                  await refreshProfile();
                }}
              >
                <Text style={styles.testButtonText}>Test: Add Spot + Review</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lists */}
          <View style={styles.section}>
            <ListRow icon="✔︎" label="Been" value={userProfile?.totalSpots || 0} />
            <View style={styles.divider} />
            <ListRow icon="⭐" label="Reviews" value={userProfile?.totalReviews || 0} />
            <View style={styles.divider} />
            <ListRow icon="🏆" label="Average Rating" value={userProfile?.averageRating ? userProfile.averageRating.toFixed(1) : '0.0'} />
          </View>

          {/* Activity card */}
          <View style={styles.activityCard}>
            {/* Header */}
            <View style={styles.activityHeader}>
              <Image source={{ uri: AVATAR_URI }} style={styles.activityAvatar} />
              <Text style={styles.activityText}>
                <Text style={styles.you}>You</Text> ranked{" "}
                <Text style={styles.bold}>The Charles River</Text>
                {"\n"}<Text style={styles.location}>📍 Cambridge, MA</Text>
              </Text>
              <Text style={styles.score}>6.7</Text>
            </View>

            {/* Place image */}
            <Image source={{ uri: PLACE_URI }} style={styles.placeImage} />

            {/* Likes + comments */}
            <View style={styles.externalBox}>
              <Text style={styles.socialItem}>💌 24 likes</Text>
              <Text style={styles.socialItem}>💬 5 comments</Text>
            </View>

            {/* Notes */}
            <View style={styles.notesWrap}>
              <Text style={styles.notesLabel}>Your note</Text>
              <Text style={styles.notesText}>“beautiful sunday morning run”</Text>
            </View>
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

  brandRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  brandLogo: { fontSize: 25, marginRight: 8 },
  brandName: { fontSize: 25, fontWeight: "700", color: "#7DA384", letterSpacing: 0.3 },

  avatarWrap: { alignItems: "center", marginTop: 8 },
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: "#EEE" },

  centerWrap: { alignItems: "center", marginTop: 12 },
  handle: { fontSize: 22, fontWeight: "700", color: "#424242" },
  joined: { fontSize: 16, color: PALETTE.subtext, marginTop: 4, textTransform: "lowercase" },

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
  ghostButtonText: { color: "#6B6B6B", fontWeight: "600", textTransform: "lowercase" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 18,
    paddingHorizontal: 12,
  },
  statItem: { alignItems: "center", minWidth: 90 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#3E3E3E" },
  statLabel: { fontSize: 13, color: "#6E6E6E", marginTop: 2, textAlign: "center" },

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
  rowIcon: { fontSize: 18, width: 26, textAlign: "center", color: "#5E5E5E" },
  rowLabel: { fontSize: 16, color: "#2F2F2F", fontWeight: "700" },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowValue: { fontSize: 16, color: "#4B4B4B", marginRight: 8, fontWeight: "700" },
  chevron: { fontSize: 24, color: "#9B9B9B", marginTop: -2 },

  divider: { height: 1, backgroundColor: PALETTE.divider, marginLeft: 16 },

  activityCard: {
    backgroundColor: "#FFF",
    marginTop: 16,
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  activityHeader: { flexDirection: "row", alignItems: "center" },
  activityAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  activityText: { flex: 1, fontSize: 15, color: "#333" },
  you: { fontWeight: "700" },
  bold: { fontWeight: "700" },
  score: { fontSize: 18, fontWeight: "800", color: PALETTE.accent },
  location: { fontSize: 14, color: "#555" },

  placeImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#EEE",
  },

  externalBox: {
    marginTop: 10,
    backgroundColor: PALETTE.externalBg,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  socialItem: { fontSize: 14, color: "#333", marginBottom: 2, fontWeight: "600" },

  notesWrap: { marginTop: 8 },
  notesLabel: { fontSize: 13, color: "#777", marginBottom: 2 },
  notesText: { fontSize: 15, fontStyle: "italic", color: "#333" },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.subtext,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.bg,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: PALETTE.subtext,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  debugText: {
    fontSize: 12,
    color: '#E65100',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: PALETTE.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
