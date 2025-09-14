import React from 'react';
import {
    Dimensions,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ThemedText } from './themed-text';

// Types based on the document structure
export interface SpotPhoto {
  caption: string;
  credit: string;
  url: string;
}

export interface SpotLocation {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Spot {
  id: string;
  name: string;
  description: string;
  category: string;
  location: SpotLocation;
  photos: SpotPhoto[];
  amenities: string[];
  averageRating: number;
  reviewCount: number;
  totalRatings: number;
  bestTimeToVisit: string[];
  difficulty: string;
  distance: string;
  duration: string;
  elevation: string;
  isVerified: boolean;
  npsCode?: string;
  website?: string;
  tags: string[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  source: string;
}

interface SpotCardProps {
  spot: Spot;
  onPress?: (spot: Spot) => void;
  style?: any;
}

const { width } = Dimensions.get('window');

export function SpotCard({ spot, onPress, style }: SpotCardProps) {
  const accentColor = '#6FA076'; // Your app's accent color

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

  return (
    <Pressable 
      style={[styles.card, style]} 
      onPress={() => onPress?.(spot)}
    >
      <View style={styles.cardContent}>
        {/* Hero Image with Overlay */}
        <View style={styles.heroContainer}>
          {spot.photos && spot.photos.length > 0 ? (
            <Image 
              source={{ uri: spot.photos[0].url }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>🌲</Text>
            </View>
          )}
          
          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            {spot.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
            <Pressable style={styles.bookmarkButton}>
              <Text style={styles.bookmarkIcon}>♡</Text>
            </Pressable>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title and Rating */}
          <View style={styles.titleSection}>
            <ThemedText style={styles.title} numberOfLines={2}>
              {spot.name}
            </ThemedText>
            
            {spot.averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{spot.averageRating.toFixed(1)}</Text>
                </View>
                <ThemedText style={styles.ratingCount}>
                  ({spot.reviewCount} reviews)
                </ThemedText>
              </View>
            )}
          </View>

          {/* Category and Location */}
          <View style={styles.metaRow}>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryIcon}>
                {getCategoryIcon(spot.category)}
              </Text>
              <ThemedText style={styles.category}>
                {spot.category.replace(/_/g, ' ').toUpperCase()}
              </ThemedText>
            </View>
            
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <ThemedText style={styles.location} numberOfLines={1}>
                {spot.location.address}
              </ThemedText>
            </View>
          </View>

          {/* Description */}
          <ThemedText style={styles.description} numberOfLines={3}>
            {spot.description}
          </ThemedText>

          {/* Key Attributes */}
          <View style={styles.attributesRow}>
            {spot.difficulty !== 'varies' && (
              <View style={styles.attributeItem}>
                <Text style={styles.attributeIcon}>⚡</Text>
                <ThemedText style={[styles.attributeText, { color: getDifficultyColor(spot.difficulty) }]}>
                  {spot.difficulty.toUpperCase()}
                </ThemedText>
              </View>
            )}
            
            {spot.distance !== 'varies' && (
              <View style={styles.attributeItem}>
                <Text style={styles.attributeIcon}>📏</Text>
                <ThemedText style={styles.attributeText}>{spot.distance}</ThemedText>
              </View>
            )}
            
            {spot.duration !== 'varies' && (
              <View style={styles.attributeItem}>
                <Text style={styles.attributeIcon}>⏱️</Text>
                <ThemedText style={styles.attributeText}>{spot.duration}</ThemedText>
              </View>
            )}
          </View>

          {/* Best Time to Visit */}
          {spot.bestTimeToVisit && spot.bestTimeToVisit.length > 0 && (
            <View style={styles.bestTimeContainer}>
              <ThemedText style={styles.sectionLabel}>Best Time to Visit</ThemedText>
              <View style={styles.bestTimeTags}>
                {spot.bestTimeToVisit.map((time, index) => (
                  <View key={index} style={styles.bestTimeTag}>
                    <ThemedText style={styles.bestTimeText}>
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {spot.tags && spot.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsScroll}
              >
                {spot.tags.slice(0, 4).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <ThemedText style={styles.tagText}>
                      {formatTags([tag])[0]}
                    </ThemedText>
                  </View>
                ))}
                {spot.tags.length > 4 && (
                  <View style={styles.moreTags}>
                    <ThemedText style={styles.moreTagsText}>
                      +{spot.tags.length - 4}
                    </ThemedText>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {spot.website && (
              <Pressable style={styles.actionButton} onPress={handleWebsitePress}>
                <Text style={styles.actionButtonIcon}>🌐</Text>
                <ThemedText style={styles.actionButtonText}>Website</ThemedText>
              </Pressable>
            )}
            
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>📞</Text>
              <ThemedText style={styles.actionButtonText}>Call</ThemedText>
            </Pressable>
            
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>🧭</Text>
              <ThemedText style={styles.actionButtonText}>Directions</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardContent: {
    backgroundColor: '#FFFAF0',
  },
  heroContainer: {
    position: 'relative',
    height: 220,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
    opacity: 0.3,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
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
  bookmarkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
    color: '#111827',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    backgroundColor: '#6FA076',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  category: {
    fontSize: 12,
    color: '#6FA076',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 16,
  },
  attributesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attributeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  attributeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bestTimeContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  bestTimeTags: {
    flexDirection: 'row',
    gap: 8,
  },
  bestTimeTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bestTimeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsScroll: {
    paddingRight: 20,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreTags: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  moreTagsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
