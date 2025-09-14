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

// Map quick category to an initial band (top / middle / bottom third)
const seedBandFromBucket = (
  bucket: 'liked' | 'fine' | 'disliked',
  n: number
) => {
  if (n <= 0) return { l: 0, r: -1 };
  const third = Math.max(1, Math.ceil(n / 3));
  if (bucket === 'liked')   return { l: 0,        r: Math.min(n - 1, third - 1) };
  if (bucket === 'fine')    return { l: third,    r: Math.min(n - 1, 2 * third - 1) };
  // disliked
  return { l: Math.min(2 * third, n - 1), r: n - 1 };
};

// Turn insertion index into a 1–10 score (top => ~10, bottom => ~1)
const indexToScore = (insertAt: number, n: number, maxScore?: number, minScore?: number) => {
  if (n <= 0) return 5.5;
  const clamped = Math.max(0, Math.min(insertAt, n)); // insertAt can be n (append)
  const normalized = 1 + 9 * (1 - clamped / n);
  let score = Math.round(normalized * 10) / 10;
  
  // Apply constraints
  if (maxScore !== undefined) {
    score = Math.min(score, maxScore);
  }
  if (minScore !== undefined) {
    score = Math.max(score, minScore);
  }
  
  return score;
};

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

  // 🔒 Frozen snapshot of the list for this session (prevents mid-flow mutations)
  const [sessionComparisons, setSessionComparisons] = useState<Spot[]>([]);

  // Binary search state
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(-1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finalIndex, setFinalIndex] = useState<number | null>(null);

  // Score + UX
  const [refinedRating, setRefinedRating] = useState<number | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [selectedBucket, setSelectedBucket] = useState<'liked' | 'fine' | 'disliked' | null>(null);
  const [maxAllowedScore, setMaxAllowedScore] = useState<number | null>(null);
  const [minAllowedScore, setMinAllowedScore] = useState<number | null>(null);

  // Guard against rapid double taps during a step
  const [lockStep, setLockStep] = useState(false);

  // Log rating changes only when they actually change
  useEffect(() => {
    if (refinedRating !== null || baseRating !== null) {
      const displayRating = refinedRating?.toFixed(1) || baseRating?.toFixed(1);
      console.log('Rating updated:', { refinedRating, baseRating, displayRating });
    }
  }, [refinedRating, baseRating]);

  // Build frozen, duplicate-free snapshot when modal opens (or spot changes)
  useEffect(() => {
    if (!visible) return;

    const filtered = (comparisonSpots || []).filter(s => s && s.id !== spot?.id);
    // If you have a user-specific score, you can sort here (desc).
    // filtered.sort((a,b) => (b.userScore ?? b.averageRating ?? 0) - (a.userScore ?? a.averageRating ?? 0));

    setSessionComparisons(filtered);

    // reset state
    setBaseRating(null);
    setSelectedBucket(null);
    setRefinedRating(null);
    setNote('');
    setFinalIndex(null);
    setComparisonCount(0);
    setLockStep(false);
    setMaxAllowedScore(null);
    setMinAllowedScore(null);

    const n = filtered.length;
    setLeft(0);
    setRight(n - 1);
    setCurrentIndex(Math.floor((0 + Math.max(-1, n - 1)) / 2));
  }, [visible, spot?.id]); // Removed comparisonSpots from dependencies

  const handleRatingPress = (bucket: 'liked' | 'fine' | 'disliked') => {
    setSelectedBucket(bucket);
  
    let rating = 5.5;
    if (bucket === 'liked') rating = 8.5;
    if (bucket === 'disliked') rating = 2.5;
  
    setBaseRating(rating);
    setRefinedRating(rating);
  
    const n = sessionComparisons.length;
    if (n === 0) {
      setFinalIndex(0);
      setRefinedRating(rating);
      return;
    }
  
    const { l, r } = seedBandFromBucket(bucket, n);
    setLeft(l);
    setRight(r);
    setCurrentIndex(Math.floor((l + r) / 2));
  
    if (l > r) {
      setFinalIndex(l);
      setRefinedRating(indexToScore(l, n));
    }
  };  

  const handleComparison = (preferred: 'new' | 'existing') => {
    if (lockStep) return;
    if (finalIndex !== null || baseRating === null) return;
  
    const n = sessionComparisons.length;
    if (n === 0) return;
  
    setLockStep(true);
    setComparisonCount(prev => prev + 1);
  
    let nextLeft = left;
    let nextRight = right;
  
    if (preferred === 'new') {
      nextRight = currentIndex - 1;   // new is better → search higher
    } else {
      nextLeft = currentIndex + 1;    // existing is better → search lower
    }
  
    if (nextLeft > nextRight) {
      const insertAt = preferred === 'new' ? currentIndex : currentIndex + 1;
      setFinalIndex(insertAt);
      setRefinedRating(indexToScore(insertAt, n));
      setLockStep(false);
    } else {
      const mid = Math.floor((nextLeft + nextRight) / 2);
      setLeft(nextLeft);
      setRight(nextRight);
      setCurrentIndex(mid);
      setTimeout(() => setLockStep(false), 120);
    }
  };  

  const handleSubmit = async () => {
    if (baseRating === null) {
      Alert.alert('Error', 'Please select a rating before submitting');
      return;
    }
    if (!spot) return;
  
    try {
      const n = sessionComparisons.length;
      let insertAt = finalIndex ?? left; // fallback to left if unfinished
      const finalRating = insertAt !== null
        ? indexToScore(insertAt, n)
        : baseRating;
  
      const rankedList = [...sessionComparisons];
      rankedList.splice(Math.max(0, Math.min(insertAt ?? n, n)), 0, spot);
  
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
    setLockStep(false);
    setMaxAllowedScore(null);
    setMinAllowedScore(null);
    onClose();
  };

  if (!spot) {
    console.log('No spot provided, returning null');
    return null;
  }

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
                          (bucket === 'disliked' && baseRating < 4)) && {
                          backgroundColor: color,
                        },
                    ]}
                    onPress={() => handleRatingPress(bucket as any)}
                  >
                    <ThemedText
                      style={[
                        styles.ratingButtonText,
                        baseRating !== null &&
                          ((bucket === 'liked' && baseRating >= 7) ||
                            (bucket === 'fine' && baseRating >= 4 && baseRating < 7) ||
                            (bucket === 'disliked' && baseRating < 4)) && {
                            color: '#FFFFFF',
                          },
                      ]}
                    >
                      {label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
  
            {/* Comparison Section */}
            {sessionComparisons.length > 0 &&
              finalIndex === null && (
                <View style={styles.comparisonSection}>
                  <ThemedText style={styles.sectionTitle}>
                    Which do you prefer?
                  </ThemedText>
                  <ThemedText style={styles.comparisonSubtitle}>
                    Help refine your rating by comparing with your other experiences
                  </ThemedText>
  
                  <View style={styles.comparisonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.comparisonCard, 
                        styles.comparisonChoice,
                        baseRating === null && styles.comparisonCardDisabled
                      ]}
                      onPress={() => baseRating !== null && handleComparison('new')}
                      disabled={baseRating === null}
                    >
                      <ThemedText style={[
                        styles.comparisonName,
                        baseRating === null && styles.comparisonTextDisabled
                      ]}>
                        {spot.name}
                      </ThemedText>
                      <ThemedText style={[
                        styles.comparisonSubtext,
                        baseRating === null && styles.comparisonTextDisabled
                      ]}>
                        {baseRating === null ? 'Select rating first' : 'This one'}
                      </ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.vsText}>vs</ThemedText>

                    <TouchableOpacity
                      style={[
                        styles.comparisonCard, 
                        styles.comparisonChoice,
                        baseRating === null && styles.comparisonCardDisabled
                      ]}
                      onPress={() => baseRating !== null && handleComparison('existing')}
                      disabled={baseRating === null}
                    >
                      <ThemedText style={[
                        styles.comparisonName,
                        baseRating === null && styles.comparisonTextDisabled
                      ]}>
                        {sessionComparisons[currentIndex]?.name || 'Another Spot'}
                      </ThemedText>
                      <ThemedText style={[
                        styles.comparisonSubtext,
                        baseRating === null && styles.comparisonTextDisabled
                      ]}>
                        {baseRating === null ? 'Select rating first' : 'That one'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
  
                  {/* Progress bar */}
                  {comparisonCount > 0 && (
                    <View style={styles.progressWrapper}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(
                              100,
                              (comparisonCount /
                                (sessionComparisons.length + 1)) *
                                100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              )}
  
            {/* Final Rating (only after comparisons or immediate finalization) */}
            {finalIndex !== null && refinedRating !== null && (
              <View
                style={[
                  styles.ratingDisplay,
                  { backgroundColor: getRatingBackgroundColor(refinedRating) },
                ]}
              >
                <ThemedText style={styles.ratingLabel}>Your Rating</ThemedText>
                <View style={styles.ratingValueContainer}>
                  <ThemedText
                    style={[
                      styles.ratingValue,
                      { color: getRatingColor(refinedRating) },
                    ]}
                  >
                    {refinedRating.toFixed(1)}/10
                  </ThemedText>
                </View>
              </View>
            )}
  
            {/* Note Section */}
            {baseRating !== null && (
              <View style={styles.noteSection}>
                <ThemedText style={styles.sectionTitle}>
                  Add a note (optional)
                </ThemedText>
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
                    {
                      backgroundColor: getRatingColor(
                        refinedRating || baseRating
                      ),
                    },
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <ThemedText style={styles.submitButtonText}>
                    {isSubmitting
                      ? 'Saving...'
                      : finalIndex !== null && refinedRating !== null
                      ? `Save Rating (${refinedRating.toFixed(1)})`
                      : 'Save Rating'}
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
  comparisonChoice: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
    color: '#6B7280',
  },
  progressWrapper: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  comparisonCardDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  comparisonTextDisabled: {
    color: '#9CA3AF',
  },
});
