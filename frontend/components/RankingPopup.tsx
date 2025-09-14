import { Spot } from '@/components/SpotCard';
import { ThemedText } from '@/components/themed-text';
import { getRatingBackgroundColor, getRatingColor } from '@/utils/ratingColors';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

/** Muted, on-theme palette */
const PALETTE = {
  cream: '#FDF1E4',      // slightly deeper cream
  surface: '#FFFFFF',
  ink: '#1A1C1D',        // darker text
  sub: '#4A4E52',
  border: '#E3E6E8',

  brand: '#2F4A43',      // deep green
  brandSoft: '#3C5E55',

  park: '#CDEBC0',       // soft green accent
  water: '#A4DDED',      // soft blue accent
  road:  '#F7C59F',      // soft peach accent

  chipBase: '#F5F7F6',
  chipBorder: '#DDE8DD',
  yellow: '#E9C44A',     // slightly muted yellow
  red: '#E23F3F',        // slightly muted red
  deepGreen: '#2D5016',  // selected "liked"

  shadow: 'rgba(0,0,0,0.12)',
};

interface RankingPopupProps {
  visible: boolean;
  onClose: () => void;
  spot: Spot | null;
  onSubmit: (rating: number, note: string, rankedList: Spot[]) => Promise<void>;
  isSubmitting?: boolean;
  comparisonSpots?: Spot[];
  isLoadingComparisonSpots?: boolean;
}

/** Seed an initial search band (top/mid/bottom third) */
const seedBandFromBucket = (
  bucket: 'liked' | 'fine' | 'disliked',
  n: number
) => {
  if (n <= 0) return { l: 0, r: -1 };
  const third = Math.max(1, Math.ceil(n / 3));
  if (bucket === 'liked') return { l: 0, r: Math.min(n - 1, third - 1) };
  if (bucket === 'fine') return { l: third, r: Math.min(n - 1, 2 * third - 1) };
  return { l: Math.min(2 * third, n - 1), r: n - 1 }; // disliked
};

/** Map insertion index -> 1–10 */
const indexToScore = (
  insertAt: number,
  n: number,
  maxScore?: number,
  minScore?: number
) => {
  if (n <= 0) return 5.5;
  const clamped = Math.max(0, Math.min(insertAt, n)); // insertAt can be n
  const normalized = 1 + 9 * (1 - clamped / n);
  let score = Math.round(normalized * 10) / 10;
  if (maxScore !== undefined) score = Math.min(score, maxScore);
  if (minScore !== undefined) score = Math.max(score, minScore);
  return score;
};

export default function RankingPopup({
  visible,
  onClose,
  spot,
  onSubmit,
  isSubmitting = false,
  comparisonSpots = [],
  isLoadingComparisonSpots = false,
}: RankingPopupProps) {
  const [baseRating, setBaseRating] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Frozen list for the session to avoid mid-flow mutations
  const [sessionComparisons, setSessionComparisons] = useState<Spot[]>([]);

  // Binary search state
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(-1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finalIndex, setFinalIndex] = useState<number | null>(null);

  // UX
  const [refinedRating, setRefinedRating] = useState<number | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [lockStep, setLockStep] = useState(false);

  // Reset on open/spot change — NOT on comparisonSpots (prevents chip flicker)
  useEffect(() => {
    if (!visible) return;
    const filtered = (comparisonSpots || []).filter((s) => s && s.id !== spot?.id);
    setSessionComparisons(filtered);

    // Reset UX state
    setBaseRating(null);
    setRefinedRating(null);
    setNote('');
    setFinalIndex(null);
    setComparisonCount(0);
    setLockStep(false);

    const n = filtered.length;
    setLeft(0);
    setRight(n - 1);
    setCurrentIndex(Math.floor((0 + Math.max(-1, n - 1)) / 2));
  }, [visible, spot?.id]); // ✅ stable

  // If list changes while open, refresh without resetting flow
  useEffect(() => {
    if (!visible) return;
    const filtered = (comparisonSpots || []).filter((s) => s && s.id !== spot?.id);
    setSessionComparisons(filtered);
  }, [comparisonSpots, visible, spot?.id]);

  const selectedFor = (bucket: 'liked' | 'fine' | 'disliked') => {
    if (baseRating === null) return false;
    if (bucket === 'liked') return baseRating >= 7;
    if (bucket === 'fine') return baseRating >= 4 && baseRating < 7;
    return baseRating < 4;
  };

  const currentComparison = useMemo(
    () =>
      sessionComparisons.length
        ? sessionComparisons[
            Math.max(0, Math.min(currentIndex, sessionComparisons.length - 1))
          ]
        : undefined,
    [sessionComparisons, currentIndex]
  );

  const estimatedSteps = useMemo(() => {
    const n = sessionComparisons.length;
    if (n <= 1) return 1;
    return Math.ceil(Math.log2(n + 1));
  }, [sessionComparisons.length]);

  const handleRatingPress = (bucket: 'liked' | 'fine' | 'disliked') => {
    // exact mapping you requested
    let rating = 5.5;
    if (bucket === 'liked') rating = 8.5;
    if (bucket === 'fine') rating = 5.0;     // yellow mid
    if (bucket === 'disliked') rating = 1.0; // red low

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
    setComparisonCount((c) => c + 1);

    let nextLeft = left;
    let nextRight = right;

    if (preferred === 'new') {
      nextRight = currentIndex - 1; // new is better → go higher
    } else {
      nextLeft = currentIndex + 1;  // existing is better → go lower
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
      setTimeout(() => setLockStep(false), 90);
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
      const insertAt = finalIndex ?? left; // fallback if unfinished
      const finalRating = insertAt !== null ? indexToScore(insertAt, n) : baseRating;

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
    onClose();
  };

  if (!spot) return null;

  const compareDisabled =
    baseRating === null || finalIndex !== null || (isLoadingComparisonSpots && sessionComparisons.length === 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"               // 🔒 no flicker. Change to "fade" if preferred.
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.popup} renderToHardwareTextureAndroid>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {spot.name}
            </ThemedText>
            <Pressable style={styles.close} onPress={handleClose}>
              <ThemedText style={styles.closeTxt}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Chips */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>How was your experience?</ThemedText>

              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, selectedFor('liked') && styles.chipSelectedGreen]}
                  onPress={() => handleRatingPress('liked')}
                  activeOpacity={0.9}
                >
                  <ThemedText style={[styles.chipTxt, selectedFor('liked') && styles.chipTxtOnDark]}>
                    I enjoyed it
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, selectedFor('fine') && styles.chipSelectedYellow]}
                  onPress={() => handleRatingPress('fine')}
                  activeOpacity={0.9}
                >
                  <ThemedText style={[styles.chipTxt, selectedFor('fine') && styles.chipTxtOnLight]}>
                    It was fine
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, selectedFor('disliked') && styles.chipSelectedRed]}
                  onPress={() => handleRatingPress('disliked')}
                  activeOpacity={0.9}
                >
                  <ThemedText style={[styles.chipTxt, selectedFor('disliked') && styles.chipTxtOnDark]}>
                    I did not enjoy it
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comparison */}
            {(sessionComparisons.length > 0 || isLoadingComparisonSpots) && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>Compare</ThemedText>
                  {baseRating !== null && finalIndex === null && sessionComparisons.length > 0 && (
                    <ThemedText style={styles.progressText}>
                      Step {Math.max(1, comparisonCount + 1)} of ~{Math.ceil(Math.log2(sessionComparisons.length + 1))}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.compareRow}>
                  <TouchableOpacity
                    style={[styles.card, styles.cardPark, compareDisabled && styles.cardDisabled]}
                    onPress={() => !compareDisabled && handleComparison('new')}
                    disabled={compareDisabled}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardAccent} />
                    <ThemedText style={styles.cardTitle} numberOfLines={2}>
                      {spot.name}
                    </ThemedText>
                    <ThemedText style={styles.cardHint}>
                      {compareDisabled
                        ? (isLoadingComparisonSpots && sessionComparisons.length === 0)
                          ? 'Loading…'
                          : baseRating === null
                          ? 'Select rating first'
                          : 'Comparison complete'
                        : 'Prefer this'}
                    </ThemedText>
                  </TouchableOpacity>

                  <ThemedText style={styles.vs}>vs</ThemedText>

                  <TouchableOpacity
                    style={[styles.card, styles.cardWater, compareDisabled && styles.cardDisabled]}
                    onPress={() => !compareDisabled && handleComparison('existing')}
                    disabled={compareDisabled}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.cardAccent, { backgroundColor: '#8DD2E6' }]} />
                    <ThemedText style={styles.cardTitle} numberOfLines={2}>
                      {currentComparison?.name || (isLoadingComparisonSpots ? 'Loading…' : 'Another Spot')}
                    </ThemedText>
                    <ThemedText style={styles.cardHint}>
                      {compareDisabled
                        ? (isLoadingComparisonSpots && sessionComparisons.length === 0)
                          ? 'Loading…'
                          : baseRating === null
                          ? 'Select rating first'
                          : 'Comparison complete'
                        : 'Prefer that'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Final Rating */}
            {finalIndex !== null && refinedRating !== null && (
              <View style={[styles.score, { backgroundColor: getRatingBackgroundColor(refinedRating) }]}>
                <ThemedText style={styles.scoreLabel}>Your Rating</ThemedText>
                <ThemedText style={[styles.scoreValue, { color: getRatingColor(refinedRating) }]}>
                  {refinedRating.toFixed(1)}/10
                </ThemedText>
              </View>
            )}

            {/* Note */}
            {baseRating !== null && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Add a note (optional)</ThemedText>
                <View style={styles.noteCard}>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Share your experience…"
                    placeholderTextColor="#7B8083"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit
                  />
                </View>
              </View>
            )}

            {/* Submit */}
            {baseRating !== null && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.submit,
                    { backgroundColor: getRatingColor(refinedRating || baseRating) },
                    isSubmitting && styles.submitDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.9}
                >
                  <ThemedText style={styles.submitTxt}>
                    {isSubmitting
                      ? 'Saving…'
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  backdrop: { ...StyleSheet.absoluteFillObject },

  popup: {
    width: width * 0.92,
    maxHeight: height * 0.9,
    borderRadius: 24,
    backgroundColor: PALETTE.surface,
    overflow: 'hidden',
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  header: {
    backgroundColor: PALETTE.brand,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  close: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  body: { backgroundColor: PALETTE.cream, paddingBottom: 16 },

  section: { paddingHorizontal: 18, paddingTop: 14 },
  sectionHeaderRow: {
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: PALETTE.ink, marginBottom: 10 },

  chipsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.chipBase,
    borderWidth: 1.5,
    borderColor: PALETTE.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  chipSelectedGreen: { backgroundColor: PALETTE.deepGreen, borderColor: PALETTE.deepGreen },
  chipSelectedYellow: { backgroundColor: PALETTE.yellow, borderColor: PALETTE.yellow },
  chipSelectedRed: { backgroundColor: PALETTE.red, borderColor: PALETTE.red },
  chipTxt: { fontSize: 13, fontWeight: '800', color: PALETTE.ink },
  chipTxtOnDark: { color: '#FFFFFF' },
  chipTxtOnLight: { color: '#1A1A1A' },

  compareRow: { flexDirection: 'row', alignItems: 'center' },
  card: {
    flex: 1,
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
    position: 'relative',
  },
  cardPark: {},
  cardWater: {},
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#B9E2AF', // park
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  cardDisabled: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', opacity: 0.65 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: PALETTE.ink, textAlign: 'center', marginBottom: 6 },
  cardHint: { fontSize: 11, color: PALETTE.sub, fontWeight: '600' },
  vs: { marginHorizontal: 6, fontSize: 13, fontWeight: '900', color: PALETTE.sub },

  progressText: { fontSize: 12, color: PALETTE.sub, fontWeight: '800' },

  score: {
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.surface,
  },
  scoreLabel: { fontSize: 13, fontWeight: '800', color: PALETTE.ink },
  scoreValue: { fontSize: 22, fontWeight: '900' },

  noteCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 10,
  },
  noteInput: {
    fontSize: 14,
    minHeight: 92,
    color: PALETTE.ink,
    lineHeight: 20,
    textAlignVertical: 'top',
  },

  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 },
  submit: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.10)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  submitDisabled: { backgroundColor: '#C7CED0' },
  submitTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
