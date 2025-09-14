import { Spot } from "@/components/SpotCard";
import { ThemedText } from "@/components/themed-text";
import { auth } from "@/config/firebase";
import { firestoreService, rankingsService } from "@/services/firestore";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function RankingPage() {
  const { spotData } = useLocalSearchParams();

  console.log("=== RANKING PAGE DEBUG ===");
  console.log("Raw spotData from params:", spotData);

  // Parse the spot data from the navigation params
  const spot: Spot = spotData ? JSON.parse(spotData as string) : null;

  console.log("Parsed spot:", spot);
  console.log("Spot name:", spot?.name);
  console.log("Spot ID:", spot?.id);
  console.log("Spot location:", spot?.location);

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ThemedText style={styles.backButtonText}>← Back</ThemedText>
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Spot not found</ThemedText>
            <ThemedText style={styles.errorText}>
              Raw data: {JSON.stringify(spotData)}
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Ensure spot has required fields
  const safeSpot = {
    ...spot,
    id: spot.id || "unknown",
    name: spot.name || "Unknown Spot",
    description: spot.description || "No description available",
    location: spot.location || { address: "Unknown Location" },
    photos: spot.photos || [],
    averageRating: spot.averageRating || 0,
  };

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    console.log("=== RANKING SUBMIT DEBUG ===");
    console.log("Rating:", rating);
    console.log("Spot:", spot);
    console.log("Spot ID:", spot?.id);
    console.log("Safe spot:", safeSpot);
    console.log("Safe spot ID:", safeSpot?.id);
    console.log("Safe spot ID type:", typeof safeSpot?.id);
    console.log("Safe spot ID length:", safeSpot?.id?.length);

    if (rating === 0) {
      Alert.alert("Error", "Please select a rating before submitting");
      return;
    }

    if (!safeSpot || !safeSpot.id || safeSpot.id === "unknown") {
      console.error("Invalid spot data:", safeSpot);
      Alert.alert("Error", `Invalid spot data. Spot ID: ${safeSpot?.id}`);
      return;
    }

    // Validate spot ID format (Firestore IDs should be non-empty strings)
    if (typeof safeSpot.id !== "string" || safeSpot.id.trim().length === 0) {
      console.error("Invalid spot ID format:", safeSpot.id);
      Alert.alert("Error", `Invalid spot ID format: ${safeSpot.id}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      console.log("Current user:", currentUser?.uid);

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to rate spots");
        return;
      }

      // Fetch user's displayName from users collection
      let userDisplayName = "User";
      try {
        const userDoc = await firestoreService.read("users", currentUser.uid);
        console.log("Fetched user document:", userDoc);
        console.log("User doc displayName field:", userDoc?.displayName);
        console.log("User doc email field:", userDoc?.email);
        console.log("User doc all fields:", Object.keys(userDoc || {}));

        // Check if displayName exists and is not empty
        if (userDoc?.displayName && userDoc.displayName.trim() !== "") {
          userDisplayName = userDoc.displayName;
          console.log("Using displayName from user doc:", userDisplayName);
        } else {
          console.log(
            "displayName is empty or undefined, falling back to email"
          );
          userDisplayName = userDoc?.email || currentUser.email || "User";
        }
        console.log("Final userDisplayName:", userDisplayName);
      } catch (err) {
        console.log("Error fetching user document:", err);
        userDisplayName = currentUser.email || "User";
      }

      console.log(
        "Submitting ranking for spot:",
        safeSpot.id,
        "with rating:",
        rating
      );

      // Create ranking data
      const rankingData = {
        userId: currentUser.uid,
        displayName: userDisplayName,
        spotId: safeSpot.id,
        spotName: safeSpot.name,
        spotLocation: safeSpot.location?.address || "Unknown Location",
        rating: rating,
        note: note.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Ranking data to save:", rankingData);

      // Save ranking to Firebase
      console.log("Calling rankingsService.createRanking...");
      console.log(
        "Ranking data being sent:",
        JSON.stringify(rankingData, null, 2)
      );

      let rankingId;
      try {
        rankingId = await rankingsService.createRanking(rankingData);
        console.log("Ranking created with ID:", rankingId);
      } catch (rankingError) {
        console.error("Error creating ranking:", rankingError);
        Alert.alert("Error", "Failed to save your rating. Please try again.");
        return;
      }

      // Update user's rankings list
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
            spotId: safeSpot.id,
            spotName: safeSpot.name,
            rating: rating,
            createdAt: new Date(),
          },
        ];

        await firestoreService.update("users", userDoc.id, {
          rankings: updatedRankings,
          totalRankings: updatedRankings.length,
          updatedAt: new Date(),
        });
      }

      // Update spot's average rating
      try {
        const currentRating = safeSpot.averageRating || 0;
        const currentCount = safeSpot.reviewCount || 0;
        const newAverage =
          (currentRating * currentCount + rating) / (currentCount + 1);

        console.log("Updating spot in Firestore:", safeSpot.id);
        await firestoreService.update("spots", safeSpot.id, {
          averageRating: Math.round(newAverage * 10) / 10,
          reviewCount: currentCount + 1,
          totalRatings: (safeSpot.totalRatings || 0) + 1,
          updatedAt: new Date(),
        });
        console.log("Spot updated successfully");
      } catch (updateError: any) {
        console.warn(
          "Could not update spot in Firestore:",
          updateError.message
        );
        // Don't fail the entire operation if spot update fails
      }

      Alert.alert("Success!", "Your rating has been saved!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("=== RANKING ERROR ===");
      console.error("Error saving rating:", error);
      console.error("Error details:", error.message);
      console.error("Error code:", error.code);
      Alert.alert("Error", `Failed to save rating: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const getRatingColor = (ratingValue: number) => {
    if (ratingValue <= rating) {
      if (ratingValue <= 3) return "#FF5722";
      if (ratingValue <= 6) return "#FF9800";
      if (ratingValue <= 8) return "#4CAF50";
      return "#2196F3";
    }
    return "#E0E0E0";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Rate This Spot</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Spot Info */}
          <View style={styles.spotInfo}>
            {safeSpot.photos && safeSpot.photos.length > 0 && (
              <Image
                source={{ uri: safeSpot.photos[0].url }}
                style={styles.spotImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.spotDetails}>
              <ThemedText style={styles.spotName}>{safeSpot.name}</ThemedText>
              <ThemedText style={styles.spotLocation}>
                📍 {safeSpot.location?.address || "Unknown Location"}
              </ThemedText>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <ThemedText style={styles.sectionTitle}>
              How would you rate this spot?
            </ThemedText>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ratingValue) => (
                <Pressable
                  key={ratingValue}
                  style={[
                    styles.ratingButton,
                    { backgroundColor: getRatingColor(ratingValue) },
                  ]}
                  onPress={() => handleRatingPress(ratingValue)}
                >
                  <ThemedText
                    style={[
                      styles.ratingButtonText,
                      ratingValue <= rating && styles.ratingButtonTextSelected,
                    ]}
                  >
                    {ratingValue}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {rating > 0 && (
              <View style={styles.ratingDescription}>
                <ThemedText style={styles.ratingDescriptionText}>
                  {rating <= 3
                    ? "Poor"
                    : rating <= 6
                    ? "Fair"
                    : rating <= 8
                    ? "Good"
                    : rating <= 9
                    ? "Great"
                    : "Excellent"}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Note Section */}
          <View style={styles.noteSection}>
            <ThemedText style={styles.sectionTitle}>
              Add a note (optional)
            </ThemedText>
            <View style={styles.noteInputContainer}>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Share your experience at this spot..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Pressable
              style={[
                styles.submitButton,
                (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? "Saving..." : "Save Rating"}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAF0",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6FA076",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },

  // Spot Info
  spotInfo: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spotImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  spotDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  spotName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  spotLocation: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Rating Section
  ratingSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  ratingButtonTextSelected: {
    color: "#FFFFFF",
  },
  ratingDescription: {
    alignItems: "center",
  },
  ratingDescriptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6FA076",
  },

  // Note Section
  noteSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteInputContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noteInput: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Submit Section
  submitSection: {
    padding: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: "#6FA076",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
  },
});
