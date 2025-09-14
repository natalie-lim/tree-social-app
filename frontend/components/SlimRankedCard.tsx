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

// Types for ranking data
export interface UserRanking {
  rankingId: string;
  spotId: string;
  spotName: string;
  spotLocation: string;
  rating: number;
  note?: string;
  createdAt: any;
  updatedAt: any;
  spotData?: any; // Full spot data for navigation
}

interface SlimRankedCardProps {
  ranking: UserRanking;
  rankNumber: number;
  onPress?: (ranking: UserRanking) => void;
  style?: any;
}

const { width } = Dimensions.get('window');


export function SlimRankedCard({ ranking, rankNumber, onPress, style }: SlimRankedCardProps) {
  const ratingColor = getRatingColor(ranking.rating);

  return (
    <Pressable 
      style={[styles.card, style]} 
      onPress={() => onPress?.(ranking)}
    >
      <View style={styles.cardContent}>
        {/* Main Row */}
        <View style={styles.mainRow}>
          {/* Left side - Rank number and Spot info */}
          <View style={styles.leftSection}>
            <View style={styles.rankNumber}>
              <Text style={styles.rankText}>#{rankNumber}</Text>
            </View>
            <View style={styles.spotInfo}>
              <ThemedText style={styles.spotName} numberOfLines={1}>
                {ranking.spotName}
              </ThemedText>
              <ThemedText style={styles.spotLocation} numberOfLines={1}>
                {ranking.spotLocation}
              </ThemedText>
            </View>
          </View>
          
          {/* Right side - Rating circle */}
          <View style={[styles.ratingCircle, { backgroundColor: ratingColor }]}>
            <Text style={styles.ratingText}>{ranking.rating.toFixed(1)}</Text>
          </View>
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
  
  // Main row with rank, spot info and rating
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
  rankNumber: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
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
