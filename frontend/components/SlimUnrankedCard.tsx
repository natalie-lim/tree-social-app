import { getRatingColor } from '@/utils/ratingColors';
import React from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { ThemedText } from './themed-text';

// Types for spot data
export interface Spot {
  id: string;
  name: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  photos: Array<{
    caption: string;
    credit: string;
    url: string;
  }>;
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

interface SlimUnrankedCardProps {
  spot: Spot;
  onPress?: (spot: Spot) => void;
  style?: any;
}

const { width } = Dimensions.get('window');

export function SlimUnrankedCard({ spot, onPress, style }: SlimUnrankedCardProps) {
  const ratingColor = spot.averageRating > 0 ? getRatingColor(spot.averageRating) : '#6B7280';
  
  return (
    <Pressable 
      style={[styles.card, style]} 
      onPress={() => onPress?.(spot)}
    >
      <View style={styles.cardContent}>
        {/* Main Row */}
        <View style={styles.mainRow}>
          {/* Left side - Bookmark icon and Spot info */}
          <View style={styles.leftSection}>
            <View style={styles.bookmarkIcon}>
              <Text style={styles.bookmarkEmoji}>🔖</Text>
            </View>
            <View style={styles.spotInfo}>
              <ThemedText style={styles.spotName} numberOfLines={1}>
                {spot.name}
              </ThemedText>
              <ThemedText style={styles.spotLocation} numberOfLines={1}>
                {spot.location?.address || 'Unknown Location'}
              </ThemedText>
            </View>
          </View>
          
          {/* Right side - Average rating circle (if available) */}
          {spot.averageRating > 0 && (
            <View style={[styles.ratingCircle, { backgroundColor: ratingColor }]}>
              <Text style={styles.ratingText}>{spot.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  // Main row with bookmark icon, spot info and rating
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  bookmarkIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  bookmarkEmoji: {
    fontSize: 16,
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  spotLocation: {
    fontSize: 13,
    color: '#6B7280',
  },
  ratingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
