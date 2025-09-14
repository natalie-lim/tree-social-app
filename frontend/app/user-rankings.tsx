// user-rankings.tsx
import { SlimRankedCard, UserRanking } from '@/components/SlimRankedCard';
import { ThemedText } from '@/components/themed-text';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestoreService } from '../services/firestore';
import { userService } from '../services/natureApp';

const PALETTE = {
  bg: "#F7F1E8",
  card: "#FFFFFF",
  text: "#1a1a1a",
  subtext: "#6F7B6F",
  accent: "#6FA076",
  accentDark: "#5C8B64",
  divider: "#E6E0D6",
  brand: "#2F4A43", // match Bookmarks back arrow color
};

export default function UserRankingsPage() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false } as any);
  }, [navigation]);

  const { userId, userName } = useLocalSearchParams();
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRankings = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profile = await userService.getUserProfile(userId as string);

        if (!profile || !(profile as any).rankings) {
          setUserRankings([]);
          return;
        }

        const rankingIds = (profile as any).rankings.map((r: any) => r.rankingId);
        const fullRankings: UserRanking[] = [];

        for (const rankingId of rankingIds) {
          try {
            const rankingDoc = await firestoreService.read('rankings', rankingId);
            if (rankingDoc) {
              const spotId = (rankingDoc as any).spotId || '';
              let spotData = null;
              if (spotId) {
                try {
                  spotData = await firestoreService.read('spots', spotId);
                } catch (spotErr) {
                  console.warn(`Could not fetch spot ${spotId}:`, spotErr);
                }
              }

              const ranking: UserRanking = {
                rankingId: rankingDoc.id || rankingId,
                spotId,
                spotName: spotData ? (spotData as any).name : (rankingDoc as any).spotName || '',
                spotLocation: spotData ? (spotData as any).location?.address : (rankingDoc as any).spotLocation || '',
                rating: (rankingDoc as any).rating || 0,
                note: (rankingDoc as any).note || '',
                createdAt: (rankingDoc as any).createdAt,
                updatedAt: (rankingDoc as any).updatedAt,
                spotData: spotData ? {
                  id: spotData.id || spotId,
                  name: (spotData as any).name || (rankingDoc as any).spotName || '',
                  description: (spotData as any).description || 'No description available',
                  category: (spotData as any).category || 'No category',
                  location: (spotData as any).location || {
                    address: (rankingDoc as any).spotLocation || 'Unknown Location',
                    coordinates: (spotData as any).location?.coordinates || { latitude: 0, longitude: 0 }
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
            const profileRanking = (profile as any).rankings.find((r: any) => r.rankingId === rankingId);
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

        const sortedRankings = fullRankings.sort((a, b) => b.rating - a.rating);
        setUserRankings(sortedRankings);
        setError(null);
      } catch (err) {
        console.error('Error fetching user rankings:', err);
        setError('Failed to load rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRankings();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* Header (centered, matches Bookmarks) */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={PALETTE.brand} />
          </TouchableOpacity>

          <ThemedText style={styles.headerTitle}>
            {userName}'s Rankings
          </ThemedText>

          {/* right-side spacer to keep title centered */}
          <View style={styles.headerSide} />
        </View>

        {/* Rankings List */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {userRankings.length > 0 ? (
            userRankings.map((ranking, index) => (
              <SlimRankedCard
                key={ranking.rankingId}
                ranking={ranking}
                rankNumber={index + 1}
                onPress={(r) => {
                  if (r.spotData) {
                    router.push({
                      pathname: '/spot-detail',
                      params: { spotData: JSON.stringify(r.spotData) }
                    });
                  } else {
                    router.push({
                      pathname: '/spot-detail',
                      params: {
                        spotData: JSON.stringify({
                          id: r.spotId,
                          name: r.spotName,
                          description: r.note || 'No description available',
                          category: 'No category',
                          location: {
                            address: r.spotLocation,
                            coordinates: { latitude: 0, longitude: 0 }
                          },
                          photos: [],
                          amenities: [],
                          averageRating: r.rating,
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
                          createdAt: r.createdAt || new Date(),
                          createdBy: userId,
                          source: 'USER_ADDED',
                          updatedAt: r.updatedAt || new Date()
                        })
                      }
                    });
                  }
                }}
                style={styles.rankingCard}
              />
            ))
          ) : (
            <View style={styles.noRankingsContainer}>
              <Text style={styles.noRankingsText}>No rankings yet</Text>
              <Text style={styles.noRankingsSubtext}>
                {userName} hasn't rated any spots yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const SIDE_TAP_AREA = 40;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  root: { flex: 1, backgroundColor: PALETTE.bg },

  // Header (matches Bookmarks: centered title with equal side widths)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  headerSide: {
    width: SIDE_TAP_AREA,
    height: SIDE_TAP_AREA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.brand,
    textAlign: 'center',
  },

  // Content
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Rankings
  rankingCard: { marginBottom: 12 },

  // Empty state
  noRankingsContainer: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noRankingsText: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.text,
    marginBottom: 8,
  },
  noRankingsSubtext: {
    fontSize: 14,
    color: PALETTE.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.bg,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: PALETTE.subtext },

  // Error
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
    marginBottom: 20,
  },
  backButton: { padding: 8 },
});
