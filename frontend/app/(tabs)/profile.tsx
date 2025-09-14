// Profile.tsx
import { RankedCard, UserRanking } from "@/components/RankedCard";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { CuteLoading } from "../../components/CuteLoading";
import { useAuth } from "../../contexts/AuthContext";
import { useRefresh } from "../../contexts/RefreshContext";
import { firestoreService } from "../../services/firestore";
import { userService } from "../../services/natureApp";

type Stat = { label: string; value: string | number };
type ListRowProps = { icon?: string; label: string; value?: string | number; onPress?: () => void };

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
  const { shouldRefreshProfile, clearRefreshFlag } = useRefresh();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch full ranking documents
  const fetchUserRankings = async (profile: UserProfile) => {
    if (!profile.rankings || profile.rankings.length === 0) {
      setUserRankings([]);
      return;
    }

    try {
      setProfileLoading(true);
      
      // Get all ranking IDs from user profile
      const rankingIds = profile.rankings.map(ranking => ranking.rankingId);
      const fullRankings: UserRanking[] = [];

      // Fetch each ranking document individually
      for (const rankingId of rankingIds) {
        try {
          const rankingDoc = await firestoreService.read('rankings', rankingId);
          if (rankingDoc) {
            const spotId = (rankingDoc as any).spotId || '';
            
            // Fetch full spot data
            let spotData = null;
            if (spotId) {
              try {
                spotData = await firestoreService.read('spots', spotId);
              } catch (spotErr) {
                console.warn(`Could not fetch spot ${spotId}:`, spotErr);
              }
            }

            // Create ranking with full spot data
            const ranking: UserRanking = {
              rankingId: rankingDoc.id || rankingId,
              spotId: spotId,
              spotName: spotData ? (spotData as any).name : (rankingDoc as any).spotName || '',
              spotLocation: spotData ? (spotData as any).location?.address : (rankingDoc as any).spotLocation || '',
              rating: (rankingDoc as any).rating || 0,
              note: (rankingDoc as any).note || '',
              createdAt: (rankingDoc as any).createdAt,
              updatedAt: (rankingDoc as any).updatedAt,
              // Add full spot data for navigation
              spotData: spotData ? {
                id: spotData.id || spotId,
                name: (spotData as any).name || (rankingDoc as any).spotName || '',
                description: (spotData as any).description || 'No description available',
                category: (spotData as any).category || 'No category',
                location: (spotData as any).location || { 
                  address: (rankingDoc as any).spotLocation || 'Unknown Location',
                  coordinates: (spotData as any).location?.coordinates || {
                    latitude: 0,
                    longitude: 0
                  }
                },
                photos: (spotData as any).photos || [],
                amenities: (spotData as any).amenities || [],
                averageRating: (spotData as any).averageRating || 0,
                reviewCount: (spotData as any).reviewCount || 0,
                totalRatings: (spotData as any).totalRatings || 0,
                bestTimeToVisit: (spotData as any).bestTimeToVisit || [],
                difficulty: (spotData as any).difficulty || 'varies',
                distance: (spotData as any).distance || '',
                duration: (spotData as any).duration || '',
                elevation: (spotData as any).elevation || '',
                isVerified: (spotData as any).isVerified || false,
                npsCode: (spotData as any).npsCode || '',
                website: (spotData as any).website || '',
                tags: (spotData as any).tags || [],
                createdAt: (spotData as any).createdAt || new Date(),
                createdBy: (spotData as any).createdBy || '',
                source: (spotData as any).source || 'USER_ADDED',
                updatedAt: (spotData as any).updatedAt || new Date()
              } : null
            };
            fullRankings.push(ranking);
          }
        } catch (err) {
          console.warn(`Could not fetch ranking ${rankingId}:`, err);
          // If ranking document doesn't exist, create a fallback from user profile data
          const profileRanking = profile.rankings.find(r => r.rankingId === rankingId);
          if (profileRanking) {
            fullRankings.push({
              rankingId: profileRanking.rankingId,
              spotId: profileRanking.spotId,
              spotName: profileRanking.spotName,
              spotLocation: 'Location not available',
              rating: profileRanking.rating,
              note: 'No notes available',
              createdAt: profileRanking.createdAt,
              updatedAt: profileRanking.createdAt,
              spotData: null
            });
          }
        }
      }

      // Sort by most recent first (createdAt descending)
      const sortedRankings = fullRankings.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Fetched full user rankings:', sortedRankings);
      setUserRankings(sortedRankings);
    } catch (err) {
      console.error('Error fetching user rankings:', err);
      setError('Failed to load rankings');
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
        
        // First, update user stats from actual data
        await userService.updateUserStats(user.uid);
        
        // Then fetch the updated profile
        const profile = await userService.getUserProfile(user.uid);
        console.log('Fetched user profile:', profile); // Debug log
        setUserProfile(profile as UserProfile);
        setError(null);

        // Fetch full ranking documents
        await fetchUserRankings(profile as UserProfile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle refresh trigger from tab press
  useEffect(() => {
    if (shouldRefreshProfile && user) {
      console.log('Refreshing profile due to tab press');
      refreshProfile();
      clearRefreshFlag();
    }
  }, [shouldRefreshProfile, user]);

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
      setUserProfile(profile as UserProfile);

      // Fetch full ranking documents
      await fetchUserRankings(profile as UserProfile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const formatJoinDate = (timestamp: any) => {
    if (!timestamp) return 'joined recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  if (authLoading || profileLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <CuteLoading 
          message="Loading your profile..." 
          size="medium" 
          showMessage={true} 
        />
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


          {/* Lists */}
          <View style={styles.section}>
            <ListRow 
              icon="✔︎" 
              label="Been" 
              value={userProfile?.totalRankings || 0} 
              onPress={() => {
                // Navigate to rankings page
                router.push({
                  pathname: '/user-rankings',
                  params: {
                    userId: user?.uid,
                    userName: userProfile?.displayName || user?.displayName || 'User'
                  }
                });
              }}
            />
            <View style={styles.divider} />
            <ListRow icon="⭐" label="Reviews" value={userProfile?.totalReviews || 0} />
            <View style={styles.divider} />
            <ListRow icon="🏆" label="Average Rating" value={userProfile?.averageRating ? userProfile.averageRating.toFixed(1) : '0.0'} />
          </View>

          {/* User's Rankings */}
          <View style={styles.rankingsSection}>
            <ThemedText style={styles.rankingsSectionTitle}>Your Recent Rankings</ThemedText>
            {userRankings.length > 0 ? (
              <View style={styles.rankingsList}>
                {userRankings.slice(0, 3).map((ranking, index) => (
                  <RankedCard
                    key={ranking.rankingId}
                    ranking={ranking}
                    onPress={(ranking) => {
                      // Navigate to spot detail with full spot data
                      if (ranking.spotData) {
                        router.push({
                          pathname: '/spot-detail',
                          params: {
                            spotData: JSON.stringify(ranking.spotData)
                          }
                        });
                      } else {
                        // Fallback to basic data if spot data not available
                        router.push({
                          pathname: '/spot-detail',
                          params: {
                            spotData: JSON.stringify({
                              id: ranking.spotId,
                              name: ranking.spotName,
                              description: ranking.note || 'No description available',
                              category: 'No category',
                              location: { 
                                address: ranking.spotLocation,
                                coordinates: {
                                  latitude: 0,
                                  longitude: 0
                                }
                              },
                              photos: [],
                              amenities: [],
                              averageRating: ranking.rating,
                              reviewCount: 1,
                              totalRatings: 1,
                              bestTimeToVisit: [],
                              difficulty: 'varies',
                              distance: '',
                              duration: '',
                              elevation: '',
                              isVerified: false,
                              npsCode: '',
                              website: '',
                              tags: [],
                              createdAt: ranking.createdAt || new Date(),
                              createdBy: user?.uid || '',
                              source: 'USER_ADDED',
                              updatedAt: ranking.updatedAt || new Date()
                            })
                          }
                        });
                      }
                    }}
                    style={styles.rankingCard}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noRankingsContainer}>
                <Text style={styles.noRankingsText}>No rankings yet</Text>
                <Text style={styles.noRankingsSubtext}>Visit spots and rate them to see your rankings here</Text>
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
  
  // Rankings section
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
  rankingsList: {
    gap: 12,
  },
  rankingCard: {
    marginBottom: 0, // Remove default margin since we're using gap
  },
  noRankingsContainer: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noRankingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text,
    marginBottom: 4,
  },
  noRankingsSubtext: {
    fontSize: 14,
    color: PALETTE.subtext,
    textAlign: 'center',
    lineHeight: 18,
  },

});
