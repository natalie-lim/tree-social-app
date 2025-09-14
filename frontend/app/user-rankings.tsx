// user-rankings.tsx
import { SlimRankedCard, UserRanking } from '@/components/SlimRankedCard';
import { ThemedText } from '@/components/themed-text';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { firestoreService } from '../services/firestore';
import { userService } from '../services/natureApp';

const PALETTE = {
  bg: "#F7F1E8",            // creamy background
  card: "#FFFFFF",
  text: "#1a1a1a",
  subtext: "#6F7B6F",       // leaf green-ish for secondary
  accent: "#6FA076",        // leafy green
  accentDark: "#5C8B64",
  divider: "#E6E0D6",
};


export default function UserRankingsPage() {
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

      // Get all ranking IDs from user profile
      const rankingIds = (profile as any).rankings.map((ranking: any) => ranking.rankingId);
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

      // Sort by rating (highest to lowest)
      const sortedRankings = fullRankings.sort((a, b) => {
        return b.rating - a.rating;
      });

      console.log('Fetched full user rankings:', sortedRankings);
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

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
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {userName}'s Rankings
          </ThemedText>
        </View>

        {/* Rankings List */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {userRankings.length > 0 ? (
            userRankings.map((ranking, index) => (
              <SlimRankedCard
                key={ranking.rankingId}
                ranking={ranking}
                rankNumber={index + 1}
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
                          createdBy: userId,
                          source: 'USER_ADDED',
                          updatedAt: ranking.updatedAt || new Date()
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

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: PALETTE.bg 
  },
  root: { 
    flex: 1, 
    backgroundColor: PALETTE.bg 
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: PALETTE.accent,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.text,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Rankings
  rankingCard: {
    marginBottom: 12,
  },

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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.subtext,
  },

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
});
