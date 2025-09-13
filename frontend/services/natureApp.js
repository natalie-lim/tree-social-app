import { firestoreService } from './firestore';
import { Timestamp } from 'firebase/firestore';

// Nature App Categories
export const NATURE_CATEGORIES = {
  HIKES_TRAILS: 'hikes_trails',
  PARKS_NATURE: 'parks_nature',
  ADVENTURE: 'adventure_activities',
  CASUAL_OUTDOORS: 'casual_outdoors',
  WILDLIFE_LOGS: 'wildlife_logs'
};

// User Service with Social Features
export const userService = {
  async createUserProfile(userId, userData) {
    const profileData = {
      ...userData,
      userId,
      followers: [],
      following: [],
      followerCount: 0,
      followingCount: 0,
      totalSpots: 0,
      totalReviews: 0,
      averageRating: 0,
      badges: [],
      joinedAt: Timestamp.now()
    };
    return await firestoreService.create('users', profileData);
  },

  async followUser(currentUserId, targetUserId) {
    // Add to current user's following
    const currentUser = await this.getUserProfile(currentUserId);
    const targetUser = await this.getUserProfile(targetUserId);
    
    if (currentUser && targetUser) {
      // Update following list
      const updatedFollowing = [...(currentUser.following || []), targetUserId];
      await firestoreService.update('users', currentUser.id, {
        following: updatedFollowing,
        followingCount: updatedFollowing.length
      });

      // Update followers list
      const updatedFollowers = [...(targetUser.followers || []), currentUserId];
      await firestoreService.update('users', targetUser.id, {
        followers: updatedFollowers,
        followerCount: updatedFollowers.length
      });
    }
  },

  async unfollowUser(currentUserId, targetUserId) {
    const currentUser = await this.getUserProfile(currentUserId);
    const targetUser = await this.getUserProfile(targetUserId);
    
    if (currentUser && targetUser) {
      // Remove from following
      const updatedFollowing = (currentUser.following || []).filter(id => id !== targetUserId);
      await firestoreService.update('users', currentUser.id, {
        following: updatedFollowing,
        followingCount: updatedFollowing.length
      });

      // Remove from followers
      const updatedFollowers = (targetUser.followers || []).filter(id => id !== currentUserId);
      await firestoreService.update('users', targetUser.id, {
        followers: updatedFollowers,
        followerCount: updatedFollowers.length
      });
    }
  },

  async getUserProfile(userId) {
    const users = await firestoreService.query('users', [
      { field: 'userId', operator: '==', value: userId }
    ]);
    return users.length > 0 ? users[0] : null;
  }
};

// Nature Spots Service
export const spotsService = {
  async createSpot(spotData) {
    const spot = {
      ...spotData,
      reviewCount: 0,
      averageRating: 0,
      totalRatings: 0,
      photos: spotData.photos || [],
      tags: spotData.tags || [],
      difficulty: spotData.difficulty || null,
      isVerified: false
    };
    return await firestoreService.create('spots', spot);
  },

  async getSpotsByCategory(category, limitCount = 20) {
    return await firestoreService.query('spots', [
      { field: 'category', operator: '==', value: category }
    ], 'averageRating', limitCount);
  },

  async getNearbySpots(latitude, longitude, radius = 50, category = null) {
    // Note: For production, you'd want to use geohash queries
    let conditions = [];
    if (category) {
      conditions.push({ field: 'category', operator: '==', value: category });
    }
    return await firestoreService.query('spots', conditions, 'averageRating');
  },

  async searchSpots(searchTerm, category = null) {
    let conditions = [
      { field: 'name', operator: '>=', value: searchTerm },
      { field: 'name', operator: '<=', value: searchTerm + '\uf8ff' }
    ];
    if (category) {
      conditions.push({ field: 'category', operator: '==', value: category });
    }
    return await firestoreService.query('spots', conditions);
  }
};

// Reviews & Ratings Service
export const reviewsService = {
  async createReview(reviewData) {
    const review = {
      ...reviewData,
      helpful: 0,
      reportCount: 0,
      isVerified: false
    };
    
    const reviewId = await firestoreService.create('reviews', review);
    
    // Update spot's rating
    await this.updateSpotRating(reviewData.spotId);
    
    return reviewId;
  },

  async updateSpotRating(spotId) {
    const reviews = await firestoreService.query('reviews', [
      { field: 'spotId', operator: '==', value: spotId }
    ]);
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await firestoreService.update('spots', spotId, {
        reviewCount: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: reviews.length
      });
    }
  },

  async getReviewsForSpot(spotId, limitCount = 10) {
    return await firestoreService.query('reviews', [
      { field: 'spotId', operator: '==', value: spotId }
    ], 'createdAt', limitCount);
  },

  async getUserReviews(userId, limitCount = 10) {
    return await firestoreService.query('reviews', [
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt', limitCount);
  }
};

// Activity Feed Service
export const feedService = {
  async createActivity(activityData) {
    const activity = {
      ...activityData,
      likes: 0,
      comments: 0,
      isPublic: activityData.isPublic !== false // Default to public
    };
    return await firestoreService.create('activities', activity);
  },

  async getFeedForUser(userId, limitCount = 20) {
    const user = await userService.getUserProfile(userId);
    const following = user?.following || [];
    
    if (following.length === 0) {
      // Return public activities if not following anyone
      return await firestoreService.query('activities', [
        { field: 'isPublic', operator: '==', value: true }
      ], 'createdAt', limitCount);
    }
    
    // Get activities from followed users
    return await firestoreService.query('activities', [
      { field: 'userId', operator: 'in', value: following },
      { field: 'isPublic', operator: '==', value: true }
    ], 'createdAt', limitCount);
  },

  async getUserActivities(userId, limitCount = 20) {
    return await firestoreService.query('activities', [
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt', limitCount);
  }
};

// Lists Service (like Beli's lists feature)
export const listsService = {
  async createList(listData) {
    const list = {
      ...listData,
      spotIds: [],
      spotCount: 0,
      isPublic: listData.isPublic !== false,
      followers: [],
      followerCount: 0
    };
    return await firestoreService.create('lists', list);
  },

  async addSpotToList(listId, spotId) {
    const list = await firestoreService.read('lists', listId);
    if (list && !list.spotIds.includes(spotId)) {
      const updatedSpotIds = [...list.spotIds, spotId];
      await firestoreService.update('lists', listId, {
        spotIds: updatedSpotIds,
        spotCount: updatedSpotIds.length
      });
    }
  },

  async getUserLists(userId) {
    return await firestoreService.query('lists', [
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt');
  },

  async getPublicLists(limitCount = 20) {
    return await firestoreService.query('lists', [
      { field: 'isPublic', operator: '==', value: true }
    ], 'followerCount', limitCount);
  }
};

// Search Service
export const searchService = {
  async globalSearch(query, filters = {}) {
    const results = {
      spots: [],
      users: [],
      lists: []
    };

    // Search spots
    if (!filters.type || filters.type === 'spots') {
      results.spots = await spotsService.searchSpots(query, filters.category);
    }

    // Search users
    if (!filters.type || filters.type === 'users') {
      results.users = await firestoreService.query('users', [
        { field: 'displayName', operator: '>=', value: query },
        { field: 'displayName', operator: '<=', value: query + '\uf8ff' }
      ]);
    }

    // Search lists
    if (!filters.type || filters.type === 'lists') {
      results.lists = await firestoreService.query('lists', [
        { field: 'name', operator: '>=', value: query },
        { field: 'name', operator: '<=', value: query + '\uf8ff' },
        { field: 'isPublic', operator: '==', value: true }
      ]);
    }

    return results;
  }
};
