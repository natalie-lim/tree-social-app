import { Spot } from '@/components/SpotCard';
import { ThemedText } from '@/components/themed-text';
import { getRatingBackgroundColor, getRatingColor } from '@/utils/ratingColors';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface RankingPopupProps {
  visible: boolean;
  onClose: () => void;
  spot: Spot | null;
  onSubmit: (rating: number, note: string, rankedList: Spot[]) => Promise<void>;
  isSubmitting?: boolean;
  comparisonSpots?: Spot[];
}

export default function RankingPopup({
  visible,
  onClose,
  spot,
  onSubmit,
  isSubmitting = false,
  comparisonSpots = [],
}: RankingPopupProps) {
  const [baseRating, setBaseRating] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Binary search state for ranking insertion
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(comparisonSpots.length - 1);
  const [currentIndex, setCurrentIndex] = useState(
    Math.floor(comparisonSpots.length / 2)
  );
  const [finalIndex, setFinalIndex] = useState<number | null>(null);

  // Complex scoring system state
  const [refinedRating, setRefinedRating] = useState<number | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);


  useEffect(() => {
    if (visible) {
      setBaseRating(null);
      setRefinedRating(null);
      setNote('');
      setLeft(0);
      setRight(comparisonSpots.length - 1);
      setCurrentIndex(Math.floor(comparisonSpots.length / 2));
      setFinalIndex(null);
      setComparisonCount(0);
    }
  }, [visible, comparisonSpots.length]);

  // Complex scoring algorithm
  const calculateComplexScore = (baseRating: number, comparisonData: any) => {
    let score = baseRating;
    
    // Factor 1: Base rating weight (40%)
    const baseWeight = 0.4;
    
    // Factor 2: Comparison adjustments (30%)
    const comparisonWeight = 0.3;
    const comparisonAdjustment = comparisonData.adjustment || 0;
    
    // Factor 3: User preference patterns (20%)
    const preferenceWeight = 0.2;
    const preferenceBonus = comparisonData.preferenceBonus || 0;
    
    // Factor 4: Spot characteristics (10%)
    const characteristicsWeight = 0.1;
    const characteristicsBonus = comparisonData.characteristicsBonus || 0;
    
    // Calculate weighted score
    score = (baseRating * baseWeight) + 
            (comparisonAdjustment * comparisonWeight) + 
            (preferenceBonus * preferenceWeight) + 
            (characteristicsBonus * characteristicsWeight);
    
    // Apply bounds and rounding
    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  };

  const handleRatingPress = (bucket: 'liked' | 'fine' | 'disliked') => {
    let rating = 5; // Default middle rating
    
    switch (bucket) {
      case 'liked':
        rating = 8.5; // High rating for liked
        break;
      case 'fine':
        rating = 5.5; // Middle rating for fine
        break;
      case 'disliked':
        rating = 2.5; // Low rating for disliked
        break;
    }
    
    setBaseRating(rating);
    setRefinedRating(rating);
  };

  const handleComparison = (preferred: 'new' | 'existing') => {
    if (finalIndex !== null || baseRating === null) return;
  
    const currentComparison = comparisonSpots[currentIndex];
    if (!currentComparison) return;
  
    setComparisonCount(prev => prev + 1);
  
    // Update binary search bounds
    let nextLeft = left;
    let nextRight = right;
  
    if (preferred === 'new') {
      nextRight = currentIndex - 1;
    } else {
      nextLeft = currentIndex + 1;
    }
  
    if (nextLeft > nextRight) {
      // Final insertion index found
      const insertAt = preferred === 'new' ? currentIndex : currentIndex + 1;
      setFinalIndex(insertAt);
  
      // 🔑 Convert index into normalized score (1–10)
      const normalized =
        1 + 9 * (1 - insertAt / Math.max(1, comparisonSpots.length));
      setRefinedRating(Math.round(normalized * 10) / 10);
    } else {
      // Keep narrowing search
      setCurrentIndex(Math.floor((nextLeft + nextRight) / 2));
      setLeft(nextLeft);
      setRight(nextRight);
    }
  };
  

  const handleSubmit = async () => {
    if (baseRating === null) {
      Alert.alert('Error', 'Please select a rating before submitting');
      return;
    }
    if (!spot) return;
  
    try {
      // If binary search finished, use refined normalized rating
      const finalRating = refinedRating || baseRating;
  
      const rankedList = [...comparisonSpots];
      const insertAt = finalIndex ?? rankedList.length;
  
      // Insert new spot into correct position
      rankedList.splice(insertAt, 0, spot);
  
      await onSubmit(finalRating, note, rankedList);
      onClose();
    } catch (error) {
      console.error('Error submitting ranking:', error);
    }
  };
  

  const handleClose = () => {
    setBaseRating(null);
    setRefinedRating(null);
    setNote('');
    setFinalIndex(null);
    setComparisonCount(0);
    onClose();
  };

  if (!spot) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.popupContainer}>
          {/* Spot Header */}
          <View style={styles.spotHeader}>
            <ThemedText style={styles.spotName}>{spot.name}</ThemedText>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </Pressable>
          </View>

          <View style={styles.contentContainer}>
            {/* Quick Rating */}
            <View style={styles.ratingSection}>
              <ThemedText style={styles.sectionTitle}>How was it?</ThemedText>
              <View style={styles.ratingContainer}>
                {[
                  { label: 'I liked it!', bucket: 'liked', color: '#4CAF50' },
                  { label: 'It was fine', bucket: 'fine', color: '#FFD700' },
                  { label: "I didn't like it", bucket: 'disliked', color: '#EF4444' },
                ].map(({ label, bucket, color }) => (
                  <TouchableOpacity
                    key={bucket}
                    style={[
                      styles.ratingButton,
                      baseRating !== null &&
                        ((bucket === 'liked' && baseRating >= 7) ||
                        (bucket === 'fine' && baseRating >= 4 && baseRating < 7) ||
                        (bucket === 'disliked' && baseRating < 4))
                        && { backgroundColor: color },
                    ]}
                    onPress={() => handleRatingPress(bucket as any)}
                  >
                    <ThemedText
                      style={[
                        styles.ratingButtonText,
                        baseRating !== null &&
                          ((bucket === 'liked' && baseRating >= 7) ||
                          (bucket === 'fine' && baseRating >= 4 && baseRating < 7) ||
                          (bucket === 'disliked' && baseRating < 4))
                          && { color: '#FFFFFF' },
                      ]}
                    >
                      {label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Show refined rating */}
              {refinedRating !== null && (
                <View style={[styles.ratingDisplay, { backgroundColor: getRatingBackgroundColor(refinedRating) }]}>
                  <ThemedText style={styles.ratingLabel}>Refined Rating:</ThemedText>
                  <View style={styles.ratingValueContainer}>
                    <ThemedText style={[styles.ratingValue, { color: getRatingColor(refinedRating) }]}>
                      {refinedRating.toFixed(1)}/10
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* Comparison Section */}
            {comparisonSpots.length > 0 && baseRating !== null && finalIndex === null && (
              <View style={styles.comparisonSection}>
                <ThemedText style={styles.sectionTitle}>Which do you prefer?</ThemedText>
                <ThemedText style={styles.comparisonSubtitle}>
                  Help us refine your rating by comparing with your other experiences
                </ThemedText>
                <View style={styles.comparisonContainer}>
                  <TouchableOpacity
                    style={[styles.comparisonCard, { borderColor: getRatingColor(refinedRating || baseRating) }]}
                    onPress={() => handleComparison('new')}
                  >
                    <ThemedText style={styles.comparisonName}>{spot.name}</ThemedText>
                    <ThemedText style={[styles.comparisonScore, { color: getRatingColor(refinedRating || baseRating) }]}>
                      Current: {refinedRating?.toFixed(1) || baseRating.toFixed(1)}
                    </ThemedText>
                    <ThemedText style={styles.comparisonSubtext}>
                      {spot.averageRating > 0 ? `Avg: ${spot.averageRating.toFixed(1)}` : 'New spot'}
                    </ThemedText>
                  </TouchableOpacity>

                  <View style={styles.orSeparator}>
                    <ThemedText style={styles.orText}>OR</ThemedText>
                  </View>

                  <TouchableOpacity
                    style={styles.comparisonCard}
                    onPress={() => handleComparison('existing')}
                  >
                    <ThemedText style={styles.comparisonName}>
                      {comparisonSpots[currentIndex]?.name || 'Another Spot'}
                    </ThemedText>
                    <ThemedText style={styles.comparisonScore}>
                      {comparisonSpots[currentIndex]?.averageRating?.toFixed(1) || 'N/A'}
                    </ThemedText>
                    <ThemedText style={styles.comparisonSubtext}>
                      Your experience
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                {/* Progress indicator */}
                {comparisonCount > 0 && (
                  <View style={styles.progressContainer}>
                    <ThemedText style={styles.progressText}>
                      Refining rating... ({comparisonCount} comparisons)
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Note Section */}
            {baseRating !== null && (
              <View style={styles.noteSection}>
                <ThemedText style={styles.sectionTitle}>Add a note (optional)</ThemedText>
                <View style={styles.noteInputContainer}>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Share your experience..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {/* Submit */}
            {baseRating !== null && (
              <View style={styles.submitSection}>
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    { backgroundColor: getRatingColor(refinedRating || baseRating) },
                    isSubmitting && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <ThemedText style={styles.submitButtonText}>
                    {isSubmitting ? 'Saving...' : `Save Rating (${refinedRating?.toFixed(1) || baseRating.toFixed(1)})`}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backdrop: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  popupContainer: { 
    width: width * 0.9, 
    maxHeight: height * 0.85, 
    backgroundColor: '#fff', 
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  contentContainer: {
    paddingBottom: 20
  },
  spotHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  spotName: { 
    fontSize: 20, 
    fontWeight: '700',
    flex: 1,
    marginRight: 10
  },
  closeButton: { 
    padding: 8, 
    borderRadius: 16, 
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  closeButtonText: { 
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600'
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 12,
    color: '#1a1a1a'
  },
  ratingSection: { 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16
  },
  ratingContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginBottom: 16
  },
  ratingButton: { 
    flex: 1, 
    marginHorizontal: 4, 
    padding: 16, 
    borderRadius: 12, 
    backgroundColor: '#ffffff', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  ratingButtonText: { 
    fontSize: 14, 
    fontWeight: '700',
    color: '#1a1a1a'
  },
  ratingDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0'
  },
  ratingLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600'
  },
  ratingValueContainer: {
    alignItems: 'flex-end'
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: '700'
  },
  comparisonSection: { 
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500'
  },
  comparisonContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  comparisonCard: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 4, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  comparisonName: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 4,
    textAlign: 'center',
    color: '#1a1a1a'
  },
  comparisonScore: { 
    fontSize: 14, 
    color: '#2D5016',
    fontWeight: '700',
    marginBottom: 2
  },
  comparisonSubtext: {
    fontSize: 12,
    color: '#1a1a1a',
    fontStyle: 'italic',
    fontWeight: '500'
  },
  orSeparator: { 
    paddingHorizontal: 8 
  },
  orText: { 
    fontSize: 14, 
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#2D5016',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  progressContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D5016'
  },
  progressText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontStyle: 'italic',
    fontWeight: '600'
  },
  noteSection: { 
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  noteInputContainer: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#e0e0e0', 
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  noteInput: { 
    fontSize: 14, 
    minHeight: 80, 
    textAlignVertical: 'top',
    color: '#1a1a1a',
    lineHeight: 20
  },
  submitSection: { 
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20
  },
  submitButton: { 
    borderRadius: 16, 
    paddingVertical: 16, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  submitButtonDisabled: { 
    backgroundColor: '#ccc' 
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16
  },
});
