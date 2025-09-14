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
}

interface RankedCardProps {
  ranking: UserRanking;
  onPress?: (ranking: UserRanking) => void;
  style?: any;
}

const { width } = Dimensions.get('window');

export function RankedCard({ ranking, onPress, style }: RankedCardProps) {
  const accentColor = '#6FA076'; // Your app's accent color

  return (
    <Pressable 
      style={[styles.card, style]} 
      onPress={() => onPress?.(ranking)}
    >
      <View style={styles.cardContent}>
        {/* Main Row */}
        <View style={styles.mainRow}>
          {/* Left side - Spot info */}
          <View style={styles.spotInfo}>
            <ThemedText style={styles.spotName} numberOfLines={1}>
              {ranking.spotName}
            </ThemedText>
            <ThemedText style={styles.spotLocation} numberOfLines={1}>
              {ranking.spotLocation}
            </ThemedText>
          </View>
          
          {/* Right side - Rating circle */}
          <View style={styles.ratingCircle}>
            <Text style={styles.ratingText}>{ranking.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* User Notes Section */}
        <View style={styles.notesSection}>
          <ThemedText style={styles.notesLabel}>Your Notes:</ThemedText>
          <ThemedText style={styles.notesText}>
            {ranking.note || 'No notes added yet'}
          </ThemedText>
        </View>

        {/* Comments and Likes Section */}
        <View style={styles.socialSection}>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>💬</Text>
            <ThemedText style={styles.socialText}>0 comments</ThemedText>
          </View>
          <View style={styles.socialItem}>
            <Text style={styles.socialIcon}>❤️</Text>
            <ThemedText style={styles.socialText}>0 likes</ThemedText>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6FA076',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 14,
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
