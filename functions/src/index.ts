import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin with default configuration
// Firebase automatically uses the project's service account when deployed
admin.initializeApp();

const db = admin.firestore();

// Cloud Function: Update user stats when a review is created
export const onReviewCreated = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const review = snap.data();
    const userId = review.userId;
    const spotId = review.spotId;

    try {
      // Update user's review count
      const userRef = db.collection('users').where('userId', '==', userId);
      const userSnapshot = await userRef.get();
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        
        await userDoc.ref.update({
          totalReviews: (userData.totalReviews || 0) + 1
        });
      }

      // Update spot's rating and review count
      const reviewsSnapshot = await db.collection('reviews')
        .where('spotId', '==', spotId)
        .get();
      
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await db.collection('spots').doc(spotId).update({
        reviewCount: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10
      });

      console.log('Successfully updated user and spot stats');
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  });

// Cloud Function: Create activity feed when user follows someone
export const onUserFollow = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if following array changed
    const beforeFollowing = before.following || [];
    const afterFollowing = after.following || [];
    
    if (afterFollowing.length > beforeFollowing.length) {
      // User followed someone new
      const newFollowId = afterFollowing.find(id => !beforeFollowing.includes(id));
      
      if (newFollowId) {
        try {
          await db.collection('activities').add({
            userId: context.params.userId,
            type: 'user_follow',
            targetUserId: newFollowId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isPublic: true
          });
          
          console.log('Created follow activity');
        } catch (error) {
          console.error('Error creating follow activity:', error);
        }
      }
    }
  });

// Cloud Function: Send notification when someone likes your post
export const onActivityLike = functions.firestore
  .document('activities/{activityId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if likes increased
    if (after.likes > before.likes) {
      const activityOwnerId = after.userId;
      
      try {
        // Create notification (you can extend this to send push notifications)
        await db.collection('notifications').add({
          userId: activityOwnerId,
          type: 'activity_like',
          activityId: context.params.activityId,
          message: 'Someone liked your activity',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Created like notification');
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }
  });

// Cloud Function: Verify spot submissions
export const verifySpot = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { spotId, verified } = data;
  
  try {
    await db.collection('spots').doc(spotId).update({
      isVerified: verified,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verifiedBy: context.auth.uid
    });
    
    return { success: true, message: 'Spot verification updated' };
  } catch (error) {
    console.error('Error verifying spot:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify spot');
  }
});

// Cloud Function: Clean up user data when account is deleted
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  
  try {
    // Delete user profile
    const userQuery = await db.collection('users').where('userId', '==', userId).get();
    const batch = db.batch();
    
    userQuery.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's reviews
    const reviewsQuery = await db.collection('reviews').where('userId', '==', userId).get();
    reviewsQuery.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's activities
    const activitiesQuery = await db.collection('activities').where('userId', '==', userId).get();
    activitiesQuery.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Successfully cleaned up user data');
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
});
