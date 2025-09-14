import { Spot } from '@/components/SpotCard';
import { ThemedText } from '@/components/themed-text';
import { auth } from '@/config/firebase';
import { rankingsService } from '@/services/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SpotDetailPage() {
  const { spotData } = useLocalSearchParams();
  
  // Parse the spot data from the navigation params
  const spot: Spot = spotData ? JSON.parse(spotData as string) : null;
  
  // State for ranking status
  const [isRanked, setIsRanked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ThemedText style={styles.backButtonText}>← Back</ThemedText>
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Spot not found</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  const formatAmenities = (amenities: string[]) => {
    return amenities.map(amenity => {
      const formatted = amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return formatted;
    });
  };

  const formatTags = (tags: string[]) => {
    return tags.map(tag => {
      const formatted = tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return formatted;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'hard': return '#F44336';
      case 'varies': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'parks_nature': return '🌲';
      case 'historical': return '🏛️';
      case 'recreation': return '🏃‍♂️';
      case 'cultural': return '🎭';
      default: return '📍';
    }
  };

  const handleWebsitePress = () => {
    if (spot.website) {
      Linking.openURL(spot.website);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Check if user has ranked this spot
  useEffect(() => {
    const checkRankingStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !spot) {
          setIsLoading(false);
          return;
        }

        // Check if user has a ranking for this spot
        const ranking = await rankingsService.getUserRankingForSpot(currentUser.uid, spot.id);

        if (ranking) {
          setIsRanked(true);
          setUserRating((ranking as any).rating);
        } else {
          setIsRanked(false);
          setUserRating(null);
        }
      } catch (error) {
        console.error('Error checking ranking status:', error);
        setIsRanked(false);
        setUserRating(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkRankingStatus();
  }, [spot]);

  const handleRankingPress = () => {
    if (isRanked) {
      // Already ranked - could show rating details or allow editing
      console.log('Spot already ranked with rating:', userRating);
    } else {
      // Navigate to ranking page
      console.log('=== SPOT DETAIL DEBUG ===');
      console.log('Spot object:', spot);
      console.log('Spot ID:', spot?.id);
      console.log('Spot name:', spot?.name);
      console.log('Spot location:', spot?.location);
      console.log('Serialized spot data:', JSON.stringify(spot));
      
      try {
        router.push({
          pathname: '/ranking',
          params: {
            spotData: JSON.stringify(spot)
          }
        });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        router.push('/ranking');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header with back button and ranking button */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
          
          {/* Ranking Button */}
          <Pressable 
            style={[
              styles.rankingButton,
              isRanked && styles.rankingButtonRanked
            ]} 
            onPress={handleRankingPress}
            disabled={isLoading}
          >
            <ThemedText style={[
              styles.rankingButtonText,
              isRanked && styles.rankingButtonTextRanked
            ]}>
              {isLoading ? '...' : isRanked ? (userRating ? userRating : '✓') : '+'}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          {spot.photos && spot.photos.length > 0 && (
            <View style={styles.heroContainer}>
              <Image 
                source={{ uri: spot.photos[0].url }} 
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay}>
                <View style={styles.titleRow}>
                  <ThemedText style={styles.title} numberOfLines={3}>
                    {spot.name}
                  </ThemedText>
                  {spot.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <ThemedText style={styles.verifiedText}>✓</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.categoryRow}>
                  <ThemedText style={styles.categoryIcon}>
                    {getCategoryIcon(spot.category)}
                  </ThemedText>
                  <ThemedText style={styles.category}>
                    {spot.category.replace(/_/g, ' ').toUpperCase()}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Description */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>About</ThemedText>
              <ThemedText style={styles.description}>
                {spot.description}
              </ThemedText>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Location</ThemedText>
              <View style={styles.locationRow}>
                <ThemedText style={styles.locationIcon}>📍</ThemedText>
                <ThemedText style={styles.locationText}>
                  {spot.location.address}
                </ThemedText>
              </View>
              <ThemedText style={styles.coordinates}>
                {spot.location.coordinates.latitude.toFixed(6)}, {spot.location.coordinates.longitude.toFixed(6)}
              </ThemedText>
            </View>

            {/* Stats */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Details</ThemedText>
              <View style={styles.statsGrid}>
                {spot.averageRating > 0 && (
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Rating</ThemedText>
                    <ThemedText style={styles.statValue}>
                      ⭐ {spot.averageRating.toFixed(1)} ({spot.reviewCount} reviews)
                    </ThemedText>
                  </View>
                )}
                
                {spot.difficulty !== 'varies' && (
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Difficulty</ThemedText>
                    <ThemedText style={[styles.statValue, { color: getDifficultyColor(spot.difficulty) }]}>
                      {spot.difficulty.toUpperCase()}
                    </ThemedText>
                  </View>
                )}

                {spot.distance !== 'varies' && (
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Distance</ThemedText>
                    <ThemedText style={styles.statValue}>{spot.distance}</ThemedText>
                  </View>
                )}

                {spot.duration !== 'varies' && (
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Duration</ThemedText>
                    <ThemedText style={styles.statValue}>{spot.duration}</ThemedText>
                  </View>
                )}

                {spot.elevation !== 'varies' && (
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Elevation</ThemedText>
                    <ThemedText style={styles.statValue}>{spot.elevation}</ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Best Time to Visit */}
            {spot.bestTimeToVisit && spot.bestTimeToVisit.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Best Time to Visit</ThemedText>
                <View style={styles.tagsContainer}>
                  {spot.bestTimeToVisit.map((time, index) => (
                    <View key={index} style={styles.timeTag}>
                      <ThemedText style={styles.timeTagText}>
                        {time.charAt(0).toUpperCase() + time.slice(1)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Tags */}
            {spot.tags && spot.tags.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
                <View style={styles.tagsContainer}>
                  {spot.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <ThemedText style={styles.tagText}>
                        {formatTags([tag])[0]}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Amenities */}
            {spot.amenities && spot.amenities.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Amenities</ThemedText>
                <View style={styles.amenitiesGrid}>
                  {spot.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <ThemedText style={styles.amenityText}>
                        {formatAmenities([amenity])[0]}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Photos Gallery */}
            {spot.photos && spot.photos.length > 1 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Photos</ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosContainer}
                >
                  {spot.photos.slice(1).map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image 
                        source={{ uri: photo.url }} 
                        style={styles.photo}
                        resizeMode="cover"
                      />
                      {photo.caption && (
                        <View style={styles.photoCaption}>
                          <ThemedText style={styles.photoCaptionText} numberOfLines={2}>
                            {photo.caption}
                          </ThemedText>
                          <ThemedText style={styles.photoCredit}>
                            {photo.credit}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Website */}
            {spot.website && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>More Information</ThemedText>
                <Pressable style={styles.websiteButton} onPress={handleWebsitePress}>
                  <ThemedText style={styles.websiteButtonText}>
                    Visit Official Website
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6FA076',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  category: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '600',
  },
  mainContent: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  coordinates: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeTagText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  amenityText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  photosContainer: {
    paddingRight: 20,
  },
  photoItem: {
    width: 200,
    marginRight: 12,
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  photoCaption: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 8,
  },
  photoCaptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  photoCredit: {
    fontSize: 10,
    color: '#999999',
    fontStyle: 'italic',
  },
  websiteButton: {
    backgroundColor: '#6FA076',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  websiteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
  },
  
  // Ranking Button Styles
  rankingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6FA076',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rankingButtonRanked: {
    backgroundColor: '#4CAF50',
  },
  rankingButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rankingButtonTextRanked: {
    fontSize: 18,
  },
});
