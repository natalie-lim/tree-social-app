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
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
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
