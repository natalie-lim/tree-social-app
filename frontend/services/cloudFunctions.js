import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// Initialize Cloud Functions
const cloudFunctions = getFunctions();

export const cloudFunctionService = {
  // Call the verifySpot function
  async verifySpot(spotId, verified) {
    try {
      const verifySpotFunction = httpsCallable(cloudFunctions, 'verifySpot');
      const result = await verifySpotFunction({ spotId, verified });
      return result.data;
    } catch (error) {
      console.error('Error calling verifySpot function:', error);
      throw error;
    }
  },

  // Example: Call a function to get user recommendations
  async getUserRecommendations(userId) {
    try {
      const getRecommendations = httpsCallable(cloudFunctions, 'getUserRecommendations');
      const result = await getRecommendations({ userId });
      return result.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  },

  // Example: Report inappropriate content
  async reportContent(contentId, reason) {
    try {
      const reportContent = httpsCallable(cloudFunctions, 'reportContent');
      const result = await reportContent({ contentId, reason });
      return result.data;
    } catch (error) {
      console.error('Error reporting content:', error);
      throw error;
    }
  }
};
