import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic CRUD operations
export const firestoreService = {
  // Create a new document
  async create(collectionName, data) {
    try {
      console.log(`Creating document in ${collectionName}:`, data);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Document created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      console.error('Collection:', collectionName);
      console.error('Data:', data);
      throw error;
    }
  },

  // Read a single document
  async read(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error reading document:', error);
      throw error;
    }
  },

  // Update a document
  async update(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete a document
  async delete(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Get all documents from a collection
  async getAll(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  },

  // Query documents with conditions
  async query(collectionName, conditions = [], orderByField, limitCount) {
    try {
      let q = collection(db, collectionName);
      
      // Apply where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, 'desc'));
      }
      
      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  },

  // Real-time listener
  onSnapshot(collectionName, callback, conditions = []) {
    let q = collection(db, collectionName);
    
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  }
};

// User-specific operations
export const userService = {
  async createUserProfile(userId, userData) {
    return await firestoreService.create('users', { ...userData, userId });
  },

  async getUserProfile(userId) {
    const users = await firestoreService.query('users', [
      { field: 'userId', operator: '==', value: userId }
    ]);
    return users.length > 0 ? users[0] : null;
  },

  async updateUserProfile(userId, userData) {
    const userProfile = await this.getUserProfile(userId);
    if (userProfile) {
      await firestoreService.update('users', userProfile.id, userData);
    }
  }
};

// Posts service (example for social app)
export const postsService = {
  async createPost(postData) {
    return await firestoreService.create('posts', postData);
  },

  async getPosts(limitCount = 10) {
    return await firestoreService.query('posts', [], 'createdAt', limitCount);
  },

  async getUserPosts(userId) {
    return await firestoreService.query('posts', [
      { field: 'authorId', operator: '==', value: userId }
    ], 'createdAt');
  },

  async updatePost(postId, postData) {
    return await firestoreService.update('posts', postId, postData);
  },

  async deletePost(postId) {
    return await firestoreService.delete('posts', postId);
  }
};

// Spots service
export const spotsService = {
  async createSpot(spotData) {
    return await firestoreService.create('spots', spotData);
  },

  async getSpots(limitCount = 20) {
    return await firestoreService.query('spots', [], 'createdAt', limitCount);
  },

  async getSpotById(spotId) {
    return await firestoreService.read('spots', spotId);
  },

  async getUserSpots(userId) {
    return await firestoreService.query('spots', [
      { field: 'createdBy', operator: '==', value: userId }
    ], 'createdAt');
  },

  async updateSpot(spotId, spotData) {
    return await firestoreService.update('spots', spotId, spotData);
  },

  async deleteSpot(spotId) {
    return await firestoreService.delete('spots', spotId);
  },

  async searchSpots(searchTerm, limitCount = 20) {
    // This would need to be implemented with proper text search
    // For now, we'll use the existing search functionality
    return await firestoreService.query('spots', [], 'name', limitCount);
  }
};

// Activities service
export const activitiesService = {
  async createActivity(activityData) {
    return await firestoreService.create('activities', activityData);
  },

  async getActivities(limitCount = 20) {
    return await firestoreService.query('activities', [], 'createdAt', limitCount);
  },

  async getUserActivities(userId, limitCount = 20) {
    return await firestoreService.query('activities', [
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt', limitCount);
  },

  async getActivityById(activityId) {
    return await firestoreService.read('activities', activityId);
  },

  async updateActivity(activityId, activityData) {
    return await firestoreService.update('activities', activityId, activityData);
  },

  async deleteActivity(activityId) {
    return await firestoreService.delete('activities', activityId);
  },

  async likeActivity(activityId, userId, isLiked) {
    const activity = await this.getActivityById(activityId);
    if (!activity) throw new Error('Activity not found');

    const newLikes = isLiked ? activity.likes + 1 : Math.max(0, activity.likes - 1);
    
    return await this.updateActivity(activityId, {
      likes: newLikes,
      isLiked: isLiked
    });
  },

  async addComment(activityId, commentData) {
    const activity = await this.getActivityById(activityId);
    if (!activity) throw new Error('Activity not found');

    return await this.updateActivity(activityId, {
      comments: (activity.comments || 0) + 1
    });
  }
};

// Rankings service
export const rankingsService = {
  async createRanking(rankingData) {
    return await firestoreService.create('rankings', rankingData);
  },

  async getUserRankings(userId, limitCount = 20) {
    return await firestoreService.query('rankings', [
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt', limitCount);
  },

  async getSpotRankings(spotId, limitCount = 20) {
    return await firestoreService.query('rankings', [
      { field: 'spotId', operator: '==', value: spotId }
    ], 'createdAt', limitCount);
  },

  async getRankingById(rankingId) {
    return await firestoreService.read('rankings', rankingId);
  },

  async updateRanking(rankingId, rankingData) {
    return await firestoreService.update('rankings', rankingId, rankingData);
  },

  async deleteRanking(rankingId) {
    return await firestoreService.delete('rankings', rankingId);
  },

  async getUserRankingForSpot(userId, spotId) {
    const rankings = await firestoreService.query('rankings', [
      { field: 'userId', operator: '==', value: userId },
      { field: 'spotId', operator: '==', value: spotId }
    ]);
    return rankings.length > 0 ? rankings[0] : null;
  }
};
