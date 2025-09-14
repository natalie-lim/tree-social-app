// user-rankings.tsx
import { SlimRankedCard, UserRanking } from '@/components/SlimRankedCard';
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
    bg: "#F5F9F4",        // soft leafy background
    card: "#F8F6F0",      // eggshell yellow
    text: "#2E2E2E",
    subtext: "#7A8B7A",    // muted sage green
    accent: "#84B082",     // warm leafy green
    accentDark: "#6E9D6E",
    divider: "#E4EAE2",
    highlight: "#FDF6EC",  // creamy highlight
  };


export default function UserRankingsPage() {
  const { userId, userName } = useLocalSearchParams();
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [filteredRankings, setFilteredRankings] = useState<UserRanking[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState(false);
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

      setUserRankings(sortedRankings);
      setFilteredRankings(sortedRankings);
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

  // Filter rankings by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredRankings(userRankings);
    } else {
      const filtered = userRankings.filter(ranking => 
        ranking.spotData?.category === selectedCategory
      );
      setFilteredRankings(filtered);
    }
  }, [selectedCategory, userRankings]);

  // Get unique categories from rankings
  const getCategories = () => {
    const categories = new Set<string>();
    userRankings.forEach(ranking => {
      if (ranking.spotData?.category) {
        categories.add(ranking.spotData.category);
      }
    });
    return Array.from(categories).sort();
  };

  const categories = getCategories();
  const allCategories = ['all', ...categories];

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'all': return '•';
      case 'z_nature': return '•';
      case 'historical': return '•';
      case 'recreation': return '•';
      case 'cultural': return '•';
      default: return '•';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'all': return 'All';
      case 'z_nature': return 'Nature';
      case 'historical': return 'Historical';
      case 'recreation': return 'Recreation';
      case 'cultural': return 'Cultural';
      default: return category;
    }
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
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Been</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Filter Dropdown */}
        {categories.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={styles.dropdownText}>
                {getCategoryLabel(selectedCategory)}
              </Text>
              <Text style={styles.dropdownIcon}>
                {showDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {allCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.dropdownItem,
                      selectedCategory === category && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedCategory === category && styles.dropdownItemTextActive
                    ]}>
                      {getCategoryLabel(category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Rankings List */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredRankings.length > 0 ? (
            filteredRankings.map((ranking, index) => (
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
              <Text style={styles.noRankingsText}>
                {selectedCategory === 'all' ? 'No rankings yet' : `No ${getCategoryLabel(selectedCategory).toLowerCase()} rankings`}
              </Text>
              <Text style={styles.noRankingsSubtext}>
                {selectedCategory === 'all' 
                  ? `${userName} hasn't rated any spots yet`
                  : `${userName} hasn't rated any ${getCategoryLabel(selectedCategory).toLowerCase()} spots yet`
                }
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
    backgroundColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: PALETTE.highlight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '600',
    color: PALETTE.accent,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PALETTE.accentDark,
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 36, // Same width as back button to center the title
  },

  // Filter Dropdown
  filterContainer: {
    backgroundColor: PALETTE.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PALETTE.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.divider,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text,
  },
  dropdownIcon: {
    fontSize: 12,
    color: PALETTE.subtext,
    marginLeft: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 20,
    right: 20,
    backgroundColor: PALETTE.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    marginTop: 4,
  },
  dropdownItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  dropdownItemActive: {
    backgroundColor: PALETTE.accent,
    borderRadius: 20,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: PALETTE.text,
  },
  dropdownItemTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Rankings
  rankingCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: PALETTE.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  // Empty state
  noRankingsContainer: {
    backgroundColor: PALETTE.highlight,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  noRankingsText: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.accentDark,
    marginBottom: 6,
  },
  noRankingsSubtext: {
    fontSize: 14,
    color: PALETTE.subtext,
    textAlign: 'center',
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
  retryButton: {
    backgroundColor: PALETTE.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
