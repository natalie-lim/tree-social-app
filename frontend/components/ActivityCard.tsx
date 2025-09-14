import { auth } from '@/config/firebase';
import { firestoreService } from '@/services/firestore';
import { getRatingColor } from '@/utils/ratingColors';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { ThemedText } from './themed-text';

export interface ActivityData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  spotId: string;
  spotName: string;
  spotLocation: string;
  spotImage?: string;
  rating: number;
  note?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: any;
  type: 'rating' | 'visit' | 'review' | 'checkin';
}

interface ActivityCardProps {
  activity: ActivityData;
  onPress?: (activity: ActivityData) => void;
  onLike?: (activityId: string, isLiked: boolean) => void;
  onComment?: (activityId: string) => void;
  style?: any;
}

export function ActivityCard({ 
  activity, 
  onPress, 
  onLike, 
  onComment, 
  style 
}: ActivityCardProps) {
  const [isLiked, setIsLiked] = useState(activity.isLiked);
  const [likesCount, setLikesCount] = useState(activity.likes);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [heartAnim] = useState(new Animated.Value(1));

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Fun heart animation
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to like activities');
        return;
      }

      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
      
      // Optimistic update
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      // Update in Firebase
      await firestoreService.update('activities', activity.id, {
        isLiked: newIsLiked,
        likes: newLikesCount
      });

      // Call parent callback if provided
      onLike?.(activity.id, newIsLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(activity.likes);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = () => {
    onComment?.(activity.id);
  };

  const handleCardPress = () => {
    // Fun press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress?.(activity);
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'rating':
        return (
          <>
            <ThemedText style={styles.you}>{activity.userName}</ThemedText> rated{" "}
            <ThemedText style={styles.bold}>{activity.spotName}</ThemedText>
            {"\n"}
            <ThemedText style={styles.location}>📍 {activity.spotLocation}</ThemedText>
          </>
        );
      case 'visit':
        return (
          <>
            <ThemedText style={styles.you}>{activity.userName}</ThemedText> visited{" "}
            <ThemedText style={styles.bold}>{activity.spotName}</ThemedText>
            {"\n"}
            <ThemedText style={styles.location}>📍 {activity.spotLocation}</ThemedText>
          </>
        );
      case 'review':
        return (
          <>
            <ThemedText style={styles.you}>{activity.userName}</ThemedText> reviewed{" "}
            <ThemedText style={styles.bold}>{activity.spotName}</ThemedText>
            {"\n"}
            <ThemedText style={styles.location}>📍 {activity.spotLocation}</ThemedText>
          </>
        );
      case 'checkin':
        return (
          <>
            <ThemedText style={styles.you}>{activity.userName}</ThemedText> checked in at{" "}
            <ThemedText style={styles.bold}>{activity.spotName}</ThemedText>
            {"\n"}
            <ThemedText style={styles.location}>📍 {activity.spotLocation}</ThemedText>
          </>
        );
      default:
        return (
          <>
            <ThemedText style={styles.you}>{activity.userName}</ThemedText> shared{" "}
            <ThemedText style={styles.bold}>{activity.spotName}</ThemedText>
            {"\n"}
            <ThemedText style={styles.location}>📍 {activity.spotLocation}</ThemedText>
          </>
        );
    }
  };


  const getTimeAgo = (timestamp: any) => {
    const now = new Date();
    const activityTime = new Date(timestamp?.toDate?.() || timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable 
        style={[styles.activityCard, style]} 
        onPress={handleCardPress}
      >
        {/* Compact Header Row */}
        <View style={styles.compactHeader}>
          <View style={styles.userInfo}>
            <Image 
              source={{ 
                uri: activity.userAvatar || 'https://via.placeholder.com/32x32/6FA076/FFFFFF?text=U' 
              }} 
              style={styles.compactAvatar} 
            />
            <View style={styles.userDetails}>
              <ThemedText style={styles.userName}>{activity.userName}</ThemedText>
              <ThemedText style={styles.activityType}>
                {activity.type === 'rating' ? '⭐ rated' : 
                 activity.type === 'visit' ? '📍 visited' :
                 activity.type === 'review' ? '📝 reviewed' : '✅ checked in'}
              </ThemedText>
            </View>
          </View>
          
          {activity.type === 'rating' && (
            <View style={[styles.compactScore, { backgroundColor: getRatingColor(activity.rating) }]}>
              <ThemedText style={styles.compactScoreText}>{activity.rating.toFixed(1)}</ThemedText>
            </View>
          )}
        </View>

        {/* Spot Info Row */}
        <View style={styles.spotInfo}>
          <View style={styles.spotDetails}>
            <ThemedText style={styles.spotName}>{activity.spotName}</ThemedText>
            <ThemedText style={styles.spotLocation}>📍 {activity.spotLocation}</ThemedText>
          </View>
          {activity.spotImage && (
            <Image 
              source={{ uri: activity.spotImage }} 
              style={styles.compactImage}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Note (if exists) */}
        {activity.note && (
          <View style={styles.compactNote}>
            <ThemedText style={styles.noteText}>💭 "{activity.note}"</ThemedText>
          </View>
        )}

        {/* Bottom Actions Row */}
        <View style={styles.bottomRow}>
          <View style={styles.socialActions}>
            <Pressable 
              style={styles.compactActionButton} 
              onPress={handleLike}
              disabled={isLoading}
            >
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <ThemedText style={[
                  styles.actionText,
                  isLiked && styles.actionTextActive
                ]}>
                  {isLiked ? '💖' : '🤍'} {likesCount}
                </ThemedText>
              </Animated.View>
            </Pressable>
            
            <Pressable 
              style={styles.compactActionButton} 
              onPress={handleComment}
            >
              <ThemedText style={styles.actionText}>
                💬 {activity.comments}
              </ThemedText>
            </Pressable>
          </View>
          
          <ThemedText style={styles.timeAgo}>
            {getTimeAgo(activity.createdAt)}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#6FA076',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F9F0',
  },
  
  // Compact Header
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  activityType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactScore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  compactScoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  
  // Spot Info
  spotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotDetails: {
    flex: 1,
  },
  spotName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  spotLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  compactImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginLeft: 10,
  },
  
  // Note
  compactNote: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6FA076',
  },
  noteText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  
  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#6FA076',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
