import { Spot } from '@/components/SpotCard';
import { ThemedText } from '@/components/themed-text';
import { auth } from '@/config/firebase';
import { rankingsService } from '@/services/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// -----------------------------
// Theme Tokens (keep in sync app-wide)
// -----------------------------
const theme = {
  colors: {
    bg: '#FFFAF0', // warm cream
    surface: '#FFFAF0', // warm cream surface
    overlay: 'rgba(0,0,0,0.55)',
    border: '#E5E7EB',
    subtext: '#6B7280',
    muted: '#9CA3AF',
    primary: '#6FA076',
    primaryAlt: '#5B8963',
    chipBg: '#FFF5E1',
    chipText: '#5B4A32',
    cardBg: '#FFF5E1',
    verified: '#22C55E',
    difficulty: {
      easy: '#22C55E',
      moderate: '#F59E0B',
      hard: '#EF4444',
      varies: '#9E9E9E',
    },
    text: '#3B2F2F', // dark cream-compatible
  },
  radius: {
    xs: 8,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
  },
  spacing: (n: number) => 4 * n,
};

// Small UI atoms
const Chip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <ThemedText style={styles.chipText}>{label}</ThemedText>
  </View>
);

const StatCard = ({ label, value, tint }: { label: string; value: string; tint?: string }) => (
  <View style={styles.statCard}>
    <ThemedText style={styles.statLabel}>{label}</ThemedText>
    <ThemedText style={[styles.statValue, tint ? { color: tint } : null]}>{value}</ThemedText>
  </View>
);

export default function SpotDetailPage() {
  const { spotData } = useLocalSearchParams();

  let spot: Spot | null = null;
  try {
    spot = spotData ? (JSON.parse(spotData as string) as Spot) : null;
  } catch (e) {
    spot = null;
  }

  const titleCased = (s?: string) =>
    (s ?? '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const amenityList = useMemo(() => (spot?.amenities ?? []).map((a) => titleCased(a)), [spot?.amenities]);
  const tagList = useMemo(() => (spot?.tags ?? []).map((t) => titleCased(t)), [spot?.tags]);

  const getDifficultyTint = (d: string | undefined) => {
    const key = (d ?? 'varies').toLowerCase();
    return (
      theme.colors.difficulty as Record<string, string>
    )[key] || theme.colors.difficulty.varies;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'parks_nature':
        return '🌲';
      case 'historical':
        return '🏛️';
      case 'recreation':
        return '🏃‍♂️';
      case 'cultural':
        return '🎭';
      default:
        return '📍';
    }
  };

  const handleWebsitePress = async () => {
    const url = spot?.website?.trim();
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {}
  };

  const handleOpenMaps = () => {
    const lat = spot?.location?.coordinates?.latitude;
    const lng = spot?.location?.coordinates?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const mapsUrl = `https://maps.apple.com/?ll=${lat},${lng}`;
      Linking.openURL(mapsUrl).catch(() => {});
    }
  };

  const handleBackPress = () => router.back();

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={handleBackPress} hitSlop={8}>
            <ThemedText style={styles.backBtnText}>← Back</ThemedText>
          </Pressable>
        </View>
        <View style={styles.centerBox}>
          <ThemedText style={styles.errorTitle}>Spot not found</ThemedText>
          <ThemedText style={styles.errorSub}>Try navigating from the previous screen again.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const heroUrl = spot.photos?.[0]?.url;

  // Check if user has ranked this spot
  useEffect(() => {
    const checkRankingStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !spot) {
          setIsLoading(false);
          return;
        }

        // Check if user has a ranking for this spot
        const ranking = await rankingsService.getUserRankingForSpot(currentUser.uid, spot.id);

        if (ranking) {
          setIsRanked(true);
          setUserRating((ranking as any).rating);
        } else {
          setIsRanked(false);
          setUserRating(null);
        }
      } catch (error) {
        console.error('Error checking ranking status:', error);
        setIsRanked(false);
        setUserRating(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkRankingStatus();
  }, [spot]);

  const handleRankingPress = () => {
    if (isRanked) {
      // Already ranked - could show rating details or allow editing
      console.log('Spot already ranked with rating:', userRating);
    } else {
      // Navigate to ranking page
      console.log('=== SPOT DETAIL DEBUG ===');
      console.log('Spot object:', spot);
      console.log('Spot ID:', spot?.id);
      console.log('Spot name:', spot?.name);
      console.log('Spot location:', spot?.location);
      console.log('Serialized spot data:', JSON.stringify(spot));
      
      try {
        router.push({
          pathname: '/ranking',
          params: {
            spotData: JSON.stringify(spot)
          }
        });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        router.push('/ranking');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBackPress} hitSlop={8}>
          <ThemedText style={styles.backBtnText}>← Back</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {heroUrl ? (
          <View style={styles.hero}>
            <Image source={{ uri: heroUrl }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.title} numberOfLines={3}>
                  {spot.name}
                </ThemedText>
                {spot.isVerified ? (
                  <View style={styles.verified}>
                    <ThemedText style={styles.verifiedMark}>✓</ThemedText>
                  </View>
                ) : null}
              </View>
              <View style={styles.categoryRow}>
                <ThemedText style={styles.categoryIcon}>{getCategoryIcon(spot.category)}</ThemedText>
                <ThemedText style={styles.categoryLabel}>{titleCased(spot.category).toUpperCase()}</ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.surface}>
          {!!spot.description && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>About</ThemedText>
              <ThemedText style={styles.body}>{spot.description}</ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Location</ThemedText>
            <View style={styles.rowCenter}>
              <ThemedText style={styles.pin}>📍</ThemedText>
              <ThemedText style={styles.addr} numberOfLines={2}>
                {spot.location?.address ?? '—'}
              </ThemedText>
            </View>
            {typeof spot.location?.coordinates?.latitude === 'number' && typeof spot.location?.coordinates?.longitude === 'number' ? (
              <ThemedText style={styles.coords}>
                {spot.location.coordinates.latitude.toFixed(6)}, {spot.location.coordinates.longitude.toFixed(6)}
              </ThemedText>
            ) : null}
            <View style={styles.rowWrap}>
              <Pressable style={styles.secondaryBtn} onPress={handleOpenMaps} hitSlop={8}>
                <ThemedText style={styles.secondaryBtnText}>Open in Maps</ThemedText>
              </Pressable>
              {spot.website ? (
                <Pressable style={[styles.secondaryBtn, { marginLeft: theme.spacing(2) }]} onPress={handleWebsitePress} hitSlop={8}>
                  <ThemedText style={styles.secondaryBtnText}>Official Website</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Other sections remain unchanged */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  backBtn: { paddingVertical: theme.spacing(2), paddingHorizontal: theme.spacing(3) },
  backBtnText: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  hero: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  heroContent: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: theme.spacing(5) },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing(2) },
  title: { fontSize: 26, fontWeight: '800', color: theme.colors.text, flex: 1, marginRight: theme.spacing(3) },
  verified: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.verified, alignItems: 'center', justifyContent: 'center' },
  verifiedMark: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { fontSize: 18, marginRight: theme.spacing(2), color: theme.colors.text },
  categoryLabel: { fontSize: 12, color: theme.colors.text, fontWeight: '700', letterSpacing: 1 },
  surface: { backgroundColor: theme.colors.surface, marginTop: -theme.spacing(5), borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, padding: theme.spacing(5) },
  section: { marginBottom: theme.spacing(6) },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: theme.spacing(3) },
  body: { fontSize: 16, lineHeight: 24, color: theme.colors.text },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  pin: { fontSize: 16, marginRight: theme.spacing(2), color: theme.colors.text },
  addr: { fontSize: 16, color: theme.colors.text, flex: 1 },
  coords: { fontSize: 13, color: theme.colors.text, fontFamily: 'monospace', marginBottom: theme.spacing(2) },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing(3.5), paddingHorizontal: theme.spacing(4), borderRadius: theme.radius.md, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { backgroundColor: theme.colors.cardBg, paddingVertical: theme.spacing(2.5), paddingHorizontal: theme.spacing(3), borderRadius: theme.radius.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, marginRight: theme.spacing(2), marginBottom: theme.spacing(2) },
  secondaryBtnText: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: { minWidth: '46%', padding: theme.spacing(3), backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, marginRight: theme.spacing(2), marginBottom: theme.spacing(2) },
  statLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing(1) },
  statValue: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  chip: { backgroundColor: theme.colors.chipBg, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(1.5), borderRadius: 999, marginRight: theme.spacing(2), marginBottom: theme.spacing(2) },
  chipText: { fontSize: 14, color: theme.colors.chipText, fontWeight: '800' },
  tag: { backgroundColor: theme.colors.cardBg, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(1.5), borderRadius: 999, marginRight: theme.spacing(2), marginBottom: theme.spacing(2) },
  tagText: { fontSize: 14, color: theme.colors.text, fontWeight: '700' },
  amenity: { backgroundColor: theme.colors.cardBg, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(2), borderRadius: theme.radius.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, marginRight: theme.spacing(2), marginBottom: theme.spacing(2) },
  amenityText: { fontSize: 14, color: theme.colors.text, fontWeight: '700' },
  galleryRow: { paddingRight: theme.spacing(5) },
  cardPhoto: { width: 200, marginRight: theme.spacing(3) },
  photo: { width: '100%', height: 150, borderRadius: theme.radius.xs },
  captionBox: { padding: theme.spacing(2), backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.xs, marginTop: theme.spacing(2) },
  captionText: { fontSize: 12, color: theme.colors.text, marginBottom: theme.spacing(1) },
  creditText: { fontSize: 11, color: theme.colors.text, fontStyle: 'italic' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(6) },
  errorTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: theme.spacing(1) },
  errorSub: { fontSize: 14, color: theme.colors.text, textAlign: 'center' },
});
