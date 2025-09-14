// Centralized rating color utilities
// This file contains all the color mapping functions used across the app

export const getRatingColor = (rating: number): string => {
  if (rating >= 8) return '#4CAF50'; // Green - Excellent
  if (rating >= 6) return '#8BC34A'; // Light Green - Good
  if (rating >= 4) return '#FFD700'; // Gold - Average
  if (rating >= 2) return '#FF9800'; // Orange - Poor
  return '#F44336'; // Red - Very Poor
};


export const getRatingBackgroundColor = (rating: number): string => {
  return getRatingColor(rating) + '20'; // Add 20% opacity
};

// Color palette for consistent theming
export const RATING_COLORS = {
  excellent: '#4CAF50',
  good: '#8BC34A',
  average: '#FFD700',
  poor: '#FF9800',
  veryPoor: '#F44336',
} as const;

// Rating thresholds
export const RATING_THRESHOLDS = {
  excellent: 8,
  good: 6,
  average: 4,
  poor: 2,
} as const;
