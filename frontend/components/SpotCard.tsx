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
  const ratingColor = getRatingColor(spot.averageRating);

  return (
    <Pressable 
      style={[styles.card, style]} 
      onPress={() => onPress?.(spot)}
    >
      <View style={styles.cardContent}>
        {/* Main Row */}
        <View style={styles.mainRow}>
          {/* Left side - Spot info */}
          <View style={styles.spotInfo}>
            <ThemedText style={styles.spotName} numberOfLines={1}>
              {spot.name}
            </ThemedText>
            <ThemedText style={styles.spotLocation} numberOfLines={1}>
              {spot.location.address}
            </ThemedText>
          </View>
          
          {/* Right side - Rating circle */}
          {spot.averageRating > 0 && (
            <View style={[styles.ratingCircle, { backgroundColor: ratingColor }]}>
              <Text style={styles.ratingText}>{spot.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* User Notes Section */}
        <View style={styles.notesSection}>
          <ThemedText style={styles.notesLabel}>Your Notes:</ThemedText>
          <ThemedText style={styles.notesText}>
            {spot.description || 'No notes added yet'}
          </ThemedText>
        </View>

        {/* Comments and Likes Section */}
        <View style={styles.socialSection}>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>💬</Text>
            <ThemedText style={styles.socialText}>{spot.reviewCount || 0} comments</ThemedText>
          </View>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>❤️</Text>
            <ThemedText style={styles.socialText}>{spot.totalRatings || 0} likes</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  
  // Main row with spot info and rating
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  spotInfo: {
    flex: 1,
    marginRight: 12,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  spotLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Notes section
  notesSection: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },

  // Social section
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  socialText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
