import { auth } from '@/config/firebase';
import { spotsService } from '@/services/firestore';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { ActivityCard, ActivityData } from './ActivityCard';
import { ThemedText } from './themed-text';

interface ActivityFeedProps {
  userId?: string; // If provided, shows only user's activities
  limit?: number;
  onActivityPress?: (activity: ActivityData) => void;
  onCommentPress?: (activityId: string) => void;
  style?: any;
}

// Convert spot data to activity data
const convertSpotToActivity = (spot: any, userId: string, userName: string): ActivityData => {
  return {
    id: `spot-${spot.id}`,
    userId: userId,
    userName: userName,
    userAvatar: spot.createdBy === userId ? undefined : 'https://via.placeholder.com/32x32/6FA076/FFFFFF?text=U',
    spotId: spot.id,
    spotName: spot.name,
    spotLocation: spot.location?.address || 'Unknown Location',
    spotImage: spot.photos?.[0]?.url || spot.photoUrl,
    rating: spot.averageRating || 0,
    note: spot.description?.substring(0, 100) + (spot.description?.length > 100 ? '...' : ''),
    likes: Math.floor(Math.random() * 50) + 5, // Random likes for demo
    comments: Math.floor(Math.random() * 20) + 1, // Random comments for demo
    isLiked: Math.random() > 0.7, // Random like status
    createdAt: spot.createdAt || new Date(),
    type: 'rating' as const
  };
};

export function ActivityFeed({ 
  userId, 
  limit = 20, 
  onActivityPress, 
  onCommentPress,
  style 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = async () => {
    try {
      setError(null);
      let spots;
      let activities: ActivityData[] = [];
      
      // Get current user info
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setActivities([]);
        setError('Please log in to view activities');
        return;
      }
      
      // Fetch user's spots
      if (userId) {
        spots = await spotsService.getUserSpots(userId, limit);
      } else {
        // Get all spots for the feed
        spots = await spotsService.getSpots(limit);
      }
      
      // Convert spots to activities
      if (spots && spots.length > 0) {
        activities = spots.map(spot => 
          convertSpotToActivity(spot, spot.createdBy || currentUser.uid, spot.createdBy === currentUser.uid ? 'You' : 'User')
        );
      }
      
      setActivities(activities);
    } catch (err) {
      console.error('Error loading spots:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [userId, limit]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const handleLike = async (activityId: string, isLiked: boolean) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // For now, just update local state since we're working with spots
      // In a real app, you'd want to store likes separately or add them to spots
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { 
                ...activity, 
                isLiked, 
                likes: isLiked ? activity.likes + 1 : Math.max(0, activity.likes - 1) 
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = (activityId: string) => {
    onCommentPress?.(activityId);
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No spots yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {userId ? "You haven't added any spots yet." : "No spots to show."}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, style]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#6FA076"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onPress={onActivityPress}
          onLike={handleLike}
          onComment={handleComment}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
