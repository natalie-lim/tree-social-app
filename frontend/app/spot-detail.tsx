import RankingPopup from '@/components/RankingPopup';
import { Spot } from '@/components/SpotCard';
import { ThemedText } from '@/components/themed-text';
import { auth } from '@/config/firebase';
import { firestoreService, rankingsService } from '@/services/firestore';
import { userService } from '@/services/natureApp';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// -----------------------------
// Theme Tokens (Beli-inspired design)
// -----------------------------
const { width: screenWidth } = Dimensions.get("window");

const theme = {
  colors: {
    bg: "#F5F5DC", // beige background
    surface: "#F5F5DC", // beige surface
    overlay: "rgba(0,0,0,0.4)",
    border: "#D4C4A8",
    subtext: "#8B7355",
    muted: "#A68B5B",
    primary: "#2D5016", // darker forest green
    primaryAlt: "#1E3A0F",
    secondary: "#228B22", // forest green
    chipBg: "#E8F5E8",
    chipText: "#2D5016",
    cardBg: "#FFFFFF",
    verified: "#228B22",
    difficulty: {
      easy: "#228B22",
      moderate: "#FFD700",
      hard: "#FF6347",
      varies: "#8B7355",
    },
    text: "#1E3A0F", // darker green
    textSecondary: "#2D5016",
    accent: "#2D5016",
    success: "#228B22",
    warning: "#FFD700",
    error: "#FF6347",
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  spacing: (n: number) => 4 * n,
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Small UI atoms
const Chip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <ThemedText style={styles.chipText}>{label}</ThemedText>
  </View>
);

const StatCard = ({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint?: string;
}) => (
  <View style={styles.statCard}>
    <ThemedText style={styles.statLabel}>{label}</ThemedText>
    <ThemedText style={[styles.statValue, tint ? { color: tint } : null]}>
      {value}
    </ThemedText>
  </View>
);

export default function SpotDetailPage() {
  const { spotData } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isRanked, setIsRanked] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRankingPopup, setShowRankingPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comparisonSpots, setComparisonSpots] = useState<Spot[]>([]);
  const [averageRanking, setAverageRanking] = useState<number>(0);
  const [rankingCount, setRankingCount] = useState<number>(0);

  let spot: Spot | null = null;
  try {
    spot = spotData ? (JSON.parse(spotData as string) as Spot) : null;
  } catch (e) {
    spot = null;
  }

  const titleCased = (s?: string) =>
    (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const amenityList = useMemo(
    () => (spot?.amenities ?? []).map((a) => titleCased(a)),
    [spot?.amenities]
  );
  const tagList = useMemo(
    () => (spot?.tags ?? []).map((t) => titleCased(t)),
    [spot?.tags]
  );

  const getDifficultyTint = (d: string | undefined) => {
    const key = (d ?? "varies").toLowerCase();
    return (
      (theme.colors.difficulty as Record<string, string>)[key] ||
      theme.colors.difficulty.varies
    );
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "z_nature":
        return "🌲";
      case "historical":
        return "🏛️";
      case "recreation":
        return "🏃‍♂️";
      case "cultural":
        return "🎭";
      default:
        return "📍";
    }
  };

  const calculateAverageRanking = async (spotId: string) => {
    try {
      // Get all rankings for this spot
      const rankings = await firestoreService.query('rankings', [
        { field: 'spotId', operator: '==', value: spotId }
      ]);

      if (rankings.length > 0) {
        const totalRating = rankings.reduce((sum, ranking) => sum + ((ranking as any).rating || 0), 0);
        const average = totalRating / rankings.length;
        const roundedAverage = Math.round(average * 10) / 10; // Round to 1 decimal place
        
        setAverageRanking(roundedAverage);
        setRankingCount(rankings.length);

        // Update the spot in the database with the new average ranking
        await firestoreService.update('spots', spotId, {
          averageRanking: roundedAverage,
          rankingCount: rankings.length,
          updatedAt: new Date()
        });

        console.log(`Updated spot ${spotId} with average ranking: ${roundedAverage} (${rankings.length} rankings)`);
      } else {
        console.log(`No rankings found for spot ${spotId}`);
        setAverageRanking(0);
        setRankingCount(0);
      }
    } catch (error) {
      console.error('Error calculating average ranking:', error);
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
    if (typeof lat === "number" && typeof lng === "number") {
      const mapsUrl = `https://maps.apple.com/?ll=${lat},${lng}`;
      Linking.openURL(mapsUrl).catch(() => {});
    }
  };

  const handleBackPress = () => router.back();

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBackPress}
            hitSlop={8}
          >
            <ThemedText style={styles.backBtnText}>← Back</ThemedText>
          </Pressable>
        </View>
        <View style={styles.centerBox}>
          <ThemedText style={styles.errorTitle}>Spot not found</ThemedText>
          <ThemedText style={styles.errorSub}>
            Try navigating from the previous screen again.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const heroUrl = spot.photos?.[0]?.url;

  // Check if user has ranked this spot and calculate average ranking
  useEffect(() => {
    const checkRankingStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !spot) {
          setIsLoading(false);
          return;
        }

        // Calculate average ranking for this spot
        await calculateAverageRanking(spot.id);

        // Check if user has a ranking for this spot
        const ranking = await rankingsService.getUserRankingForSpot(
          currentUser.uid,
          spot.id
        );

        if (ranking) {
          setIsRanked(true);
          setUserRating((ranking as any).rating);
        } else {
          setIsRanked(false);
          setUserRating(null);
        }
      } catch (error) {
        console.error("Error checking ranking status:", error);
        setIsRanked(false);
        setUserRating(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkRankingStatus();
  }, [spot]);

  const handleRankingPress = () => {
    // Always show ranking popup - allows both new rankings and editing existing ones
    console.log('Ranking button pressed, current state:', { isRanked, showRankingPopup, userRating });
    setShowRankingPopup(true);
  };

  const handleSubmitRanking = async (
    rating: number,
    note: string,
    rankedList: Spot[]
  ) => {
    if (!spot) return;

    console.log('handleSubmitRanking called with rating:', rating, 'note:', note);
    setIsSubmitting(true);
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in to rate spots");
      }

      // Create ranking data
      const rankingData = {
        userId: currentUser.uid,
        spotId: spot.id,
        spotName: spot.name,
        spotLocation: spot.location?.address || "Unknown Location",
        rating: rating,
        note: note.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save ranking to Firebase
      const rankingId = await rankingsService.createRanking(rankingData);

      // Update user's rankings list with the new ranking
      const userRankings = await firestoreService.query("users", [
        { field: "userId", operator: "==", value: currentUser.uid },
      ]);

      if (userRankings.length > 0) {
        const userDoc = userRankings[0];
        const currentRankings = (userDoc as any).rankings || [];
        const updatedRankings = [
          ...currentRankings,
          {
            rankingId: rankingId,
            spotId: spot.id,
            spotName: spot.name,
            rating: rating,
            createdAt: new Date(),
          },
        ];

        await firestoreService.update("users", userDoc.id, {
          rankings: updatedRankings,
          totalRankings: updatedRankings.length,
          points: ((userDoc as any).points || 0) + 5,
          updatedAt: new Date(),
        });
      }

      // Note: We don't update the spot's averageRating here because this is a personal ranking,
      // not a review. The spot's averageRating should only be updated when actual reviews are created.
      // Personal rankings are stored separately in the user's profile and rankings collection.

      // Update user's average ranking
      try {
        await userService.updateUserStats(currentUser.uid);
        console.log('Updated user average ranking');
      } catch (updateError: any) {
        console.warn('Could not update user average ranking:', updateError.message);
      }

      // Recalculate average ranking for this spot
      await calculateAverageRanking(spot.id);

      // Update local state
      console.log('Setting user rating to:', rating);
      setIsRanked(true);
      setUserRating(rating);
      setShowRankingPopup(false);

      // Note: The rankedList parameter contains the user's personal ranking order
      // This could be used for future features like showing user's personal rankings
    } catch (error: any) {
      console.error("Error saving rating:", error);
      throw error; // Re-throw to let the popup handle the error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePopup = () => {
    setShowRankingPopup(false);
  };

  // Fetch user's previously ranked spots for comparison
  useEffect(() => {
    const fetchUserRankedSpots = async () => {
      if (!spot) return;

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setComparisonSpots([]);
          return;
        }

        // Get user's profile to find their rankings
        const userRankings = await firestoreService.query("users", [
          { field: "userId", operator: "==", value: currentUser.uid },
        ]);

        if (userRankings.length === 0) {
          setComparisonSpots([]);
          return;
        }

        const userDoc = userRankings[0];
        const userRankingsList = (userDoc as any).rankings || [];

        if (userRankingsList.length === 0) {
          setComparisonSpots([]);
          return;
        }

        // Get spots that user has ranked, excluding current spot
        const rankedSpotIds = userRankingsList
          .map((ranking: any) => ranking.spotId)
          .filter((spotId: string) => spotId !== spot.id);

        if (rankedSpotIds.length === 0) {
          setComparisonSpots([]);
          return;
        }

        // Fetch the actual spot data for user's ranked spots
        const rankedSpots: Spot[] = [];
        for (const spotId of rankedSpotIds) {
          try {
            const spotDoc = await firestoreService.read("spots", spotId);
            if (spotDoc) {
              const spotData = {
                id: spotDoc.id || spotId,
                name: (spotDoc as any).name || "Unknown Spot",
                description:
                  (spotDoc as any).description || "No description available",
                category: (spotDoc as any).category || "No category",
                location: (spotDoc as any).location || {
                  address: "Unknown Location",
                },
                photos: (spotDoc as any).photos || [],
                amenities: (spotDoc as any).amenities || [],
                averageRating: (spotDoc as any).averageRating || 0,
                reviewCount: (spotDoc as any).reviewCount || 0,
                totalRatings: (spotDoc as any).totalRatings || 0,
                bestTimeToVisit: (spotDoc as any).bestTimeToVisit || [],
                difficulty: (spotDoc as any).difficulty || "varies",
                distance: (spotDoc as any).distance || "",
                duration: (spotDoc as any).duration || "",
                elevation: (spotDoc as any).elevation || "",
                isVerified: (spotDoc as any).isVerified || false,
                npsCode: (spotDoc as any).npsCode || "",
                website: (spotDoc as any).website || "",
                tags: (spotDoc as any).tags || [],
                createdAt: (spotDoc as any).createdAt || new Date(),
                createdBy: (spotDoc as any).createdBy || "",
                source: (spotDoc as any).source || "USER_ADDED",
                updatedAt: (spotDoc as any).updatedAt || new Date(),
              } as Spot;
              rankedSpots.push(spotData);
            }
          } catch (err) {
            console.warn(`Could not fetch spot ${spotId}:`, err);
          }
        }

        // Sort by user's rating (highest first) for better comparison experience
        const sortedSpots = rankedSpots.sort((a, b) => {
          const aRanking = userRankingsList.find((r: any) => r.spotId === a.id);
          const bRanking = userRankingsList.find((r: any) => r.spotId === b.id);
          return (bRanking?.rating || 0) - (aRanking?.rating || 0);
        });

        setComparisonSpots(sortedSpots);
      } catch (error) {
        console.warn("Could not fetch user ranked spots:", error);
        setComparisonSpots([]);
      }
    };

    fetchUserRankedSpots();
  }, [spot]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBackPress} hitSlop={8}>
          <ThemedText style={styles.backBtnText}>← Back</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {heroUrl ? (
            <Image
              source={{ uri: heroUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder} />
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.title} numberOfLines={3}>
                {spot.name}
              </ThemedText>

              <View style={styles.rankingSection}>
                {/* Average Ranking */}
                {rankingCount > 0 && (
                  <View style={styles.averageRankingContainer}>
                    <ThemedText style={styles.averageRankingText}>
                      {averageRanking}
                    </ThemedText>
                    <ThemedText style={styles.averageRankingLabel}>
                      avg
                    </ThemedText>
                  </View>
                )}

                {/* User Ranking Button */}
                <Pressable onPress={handleRankingPress} hitSlop={10}>
                  <View style={[styles.rankIcon, isRanked ? styles.rankIconChecked : styles.rankIconAdd]}>
                    <ThemedText style={styles.rankIconText}>
                      {isRanked ? `${userRating}` : '+'}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.categoryRow}>
              <ThemedText style={styles.categoryIcon}>
                {getCategoryIcon(spot.category)}
              </ThemedText>
              <ThemedText style={styles.categoryLabel}>
                {titleCased(spot.category).toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

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
                {spot.location?.address ?? "—"}
              </ThemedText>
            </View>
            {typeof spot.location?.coordinates?.latitude === "number" &&
            typeof spot.location?.coordinates?.longitude === "number" ? (
              <ThemedText style={styles.coords}>
                {spot.location.coordinates.latitude.toFixed(6)},{" "}
                {spot.location.coordinates.longitude.toFixed(6)}
              </ThemedText>
            ) : null}
            <View style={styles.rowWrap}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={handleOpenMaps}
                hitSlop={8}
              >
                <ThemedText style={styles.secondaryBtnText}>
                  Open in Maps
                </ThemedText>
              </Pressable>
              {spot.website ? (
                <Pressable
                  style={[
                    styles.secondaryBtn,
                    { marginLeft: theme.spacing(2) },
                  ]}
                  onPress={handleWebsitePress}
                  hitSlop={8}
                >
                  <ThemedText style={styles.secondaryBtnText}>
                    Official Website
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Details</ThemedText>
            <View style={styles.statsGrid}>
              {spot.difficulty && (
                <StatCard
                  label="Difficulty"
                  value={titleCased(spot.difficulty)}
                  tint={getDifficultyTint(spot.difficulty)}
                />
              )}
              {spot.distance && (
                <StatCard label="Distance" value={spot.distance} />
              )}
              {spot.duration && (
                <StatCard label="Duration" value={spot.duration} />
              )}
              {spot.elevation && (
                <StatCard label="Elevation" value={spot.elevation} />
              )}
            </View>
          </View>

          {/* Best Time to Visit */}
          {spot.bestTimeToVisit && spot.bestTimeToVisit.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Best Time to Visit
              </ThemedText>
              <View style={styles.chipContainer}>
                {spot.bestTimeToVisit.map((time, index) => (
                  <Chip key={index} label={titleCased(time)} />
                ))}
              </View>
            </View>
          )}

          {/* Amenities */}
          {amenityList.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Amenities</ThemedText>
              <View style={styles.chipContainer}>
                {amenityList.map((amenity, index) => (
                  <Chip key={index} label={amenity} />
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {tagList.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
              <View style={styles.chipContainer}>
                {tagList.map((tag, index) => (
                  <Chip key={index} label={tag} />
                ))}
              </View>
            </View>
          )}

          {/* Photo Gallery */}
          {spot.photos && spot.photos.length > 1 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Photos</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.galleryScroll}
                contentContainerStyle={styles.galleryContainer}
              >
                {spot.photos.slice(1).map((photo, index) => (
                  <View key={index} style={styles.galleryItem}>
                    <Image
                      source={{ uri: photo.url }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    {photo.caption && (
                      <View style={styles.captionBox}>
                        <ThemedText style={styles.captionText}>
                          {photo.caption}
                        </ThemedText>
                        {photo.credit && (
                          <ThemedText style={styles.creditText}>
                            Photo: {photo.credit}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* NPS Code */}
          {spot.npsCode && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                National Park Service
              </ThemedText>
              <ThemedText style={styles.npsCode}>
                NPS Code: {spot.npsCode}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ranking Popup */}
      <RankingPopup
        visible={showRankingPopup}
        onClose={handleClosePopup}
        spot={spot}
        onSubmit={handleSubmitRanking}
        isSubmitting={isSubmitting}
        comparisonSpots={comparisonSpots}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    backgroundColor: theme.colors.bg,
    ...theme.shadows.sm,
  },
  backBtn: {
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    borderRadius: theme.radius.sm,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  hero: {
    height: 300,
    position: "relative",
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing(6),
    paddingBottom: theme.spacing(8),
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: theme.spacing(4),
    minHeight: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1,
    marginRight: theme.spacing(3),
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  verified: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.verified,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  verifiedMark: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },
  rankIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.md,
  },
  rankIconAdd: {
    backgroundColor: theme.colors.primary,
  },
  rankIconChecked: {
    backgroundColor: theme.colors.success,
  },
  rankIconText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
  },
  rankingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  averageRankingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    ...theme.shadows.sm,
  },
  averageRankingText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  averageRankingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  categoryRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: theme.spacing(2),
    color: "#FFFFFF",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  surface: {
    backgroundColor: theme.colors.surface,
    marginTop: -theme.spacing(6),
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing(6),
    ...theme.shadows.lg,
  },
  section: {
    marginBottom: theme.spacing(8),
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing(4),
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: theme.colors.textSecondary,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing(3),
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pin: {
    fontSize: 18,
    marginRight: theme.spacing(3),
    color: theme.colors.primary,
  },
  addr: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    fontWeight: "500",
  },
  coords: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: "monospace",
    marginBottom: theme.spacing(3),
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radius.xs,
    alignSelf: "flex-start",
  },
  secondaryBtn: {
    backgroundColor: theme.colors.cardBg,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(3),
    ...theme.shadows.sm,
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -theme.spacing(1),
  },
  statCard: {
    minWidth: "47%",
    padding: theme.spacing(4),
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing(1),
    marginBottom: theme.spacing(3),
    ...theme.shadows.sm,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -theme.spacing(1),
  },
  chip: {
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing(1),
    marginBottom: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.chipText,
    fontWeight: "600",
  },
  galleryScroll: {
    marginHorizontal: -theme.spacing(6),
  },
  galleryContainer: {
    paddingHorizontal: theme.spacing(6),
  },
  galleryItem: {
    width: 200,
    marginRight: theme.spacing(3),
  },
  galleryImage: {
    width: "100%",
    height: 150,
    borderRadius: theme.radius.lg,
  },
  captionBox: {
    padding: theme.spacing(3),
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing(2),
    ...theme.shadows.sm,
  },
  captionText: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
    fontWeight: "500",
  },
  creditText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  npsCode: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.md,
    alignSelf: "flex-start",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(6),
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing(2),
  },
  errorSub: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});
