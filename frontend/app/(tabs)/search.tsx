import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { spotsService } from "../../services/natureApp";

const PALETTE = {
  bg: "#F7F1E8",            // creamy background
  card: "#FFFFFF",
  text: "#3E3E3E",
  subtext: "#6F7B6F",       // leaf green-ish for secondary
  accent: "#6FA076",        // leafy green
  accentDark: "#5C8B64",
  divider: "#E6E0D6",
  inputBg: "#F8F4EE",
  border: "#DED7CB",
  externalBg: "#F1EFE9",    // muted tan/gray for external likes/comments
};

// Helper function to get the first photo URL from Firebase data
const getPhotoUrl = (photos) => {
  if (photos && photos.length > 0) {
    return photos[0].url || photos[0];
  }
  return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop';
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'hikes_trails': return '🥾';
    case 'parks_nature': return '🌲';
    case 'adventure_activities': return '🧗';
    case 'casual_outdoors': return '🌿';
    case 'wildlife_logs': return '🦅';
    default: return '📍';
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'moderate': return '#FF9800';
    case 'hard': return '#F44336';
    case 'expert': return '#9C27B0';
    default: return PALETTE.subtext;
  }
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await spotsService.searchSpots(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const renderSpotItem = ({ item }) => (
    <TouchableOpacity style={styles.spotCard} activeOpacity={0.8}>
      <View style={styles.spotImageContainer}>
        <Image 
          source={{ uri: getPhotoUrl(item.photos) }} 
          style={styles.spotImage}
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
        </View>
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>
      
      <View style={styles.spotInfo}>
        <Text style={styles.spotName}>{item.name}</Text>
        <Text style={styles.spotLocation}>📍 {item.location?.name || item.location?.address || 'Location not specified'}</Text>
        
        {item.description && (
          <Text style={styles.spotDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.spotMeta}>
          {item.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.averageRating.toFixed(1)}</Text>
            </View>
          )}
          {item.difficulty && item.difficulty !== 'varies' && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty.toUpperCase()}
              </Text>
            </View>
          )}
          {item.reviewCount > 0 && (
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewText}>{item.reviewCount} reviews</Text>
            </View>
          )}
        </View>

        {item.amenities && item.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            <Text style={styles.amenitiesTitle}>Amenities:</Text>
            <View style={styles.amenitiesList}>
              {item.amenities.slice(0, 3).map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity.replace('_', ' ')}</Text>
                </View>
              ))}
              {item.amenities.length > 3 && (
                <Text style={styles.moreAmenities}>+{item.amenities.length - 3} more</Text>
              )}
            </View>
          </View>
        )}
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 4).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {item.bestTimeToVisit && item.bestTimeToVisit.length > 0 && (
          <View style={styles.seasonContainer}>
            <Text style={styles.seasonText}>
              Best time: {item.bestTimeToVisit.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header brand */}
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>🌿</Text>
            <Text style={styles.brandName}>Leaflet</Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for places..."
                placeholderTextColor={PALETTE.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PALETTE.accent} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Search Results */}
          {searchQuery && !loading && !error && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeader}>
                {searchResults.length} place{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderSpotItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                style={styles.resultsList}
              />
            </View>
          )}

          {/* Empty State */}
          {!searchQuery && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🌲</Text>
              <Text style={styles.emptyTitle}>Discover Amazing Places</Text>
              <Text style={styles.emptyText}>Start typing to search for hiking trails, parks, and outdoor adventures</Text>
            </View>
          )}

          {/* Popular Categories */}
          {!searchQuery && !loading && (
            <View style={styles.categoriesContainer}>
              <Text style={styles.categoriesTitle}>Popular Categories</Text>
              <View style={styles.categoriesGrid}>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🥾</Text>
                  <Text style={styles.categoryCardText}>Hiking Trails</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🌲</Text>
                  <Text style={styles.categoryCardText}>Parks & Nature</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🧗</Text>
                  <Text style={styles.categoryCardText}>Adventure</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryCardIcon}>🌿</Text>
                  <Text style={styles.categoryCardText}>Casual Outdoors</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  root: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingBottom: 40 },

  brandRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  brandLogo: { fontSize: 25, marginRight: 8 },
  brandName: { fontSize: 25, fontWeight: "700", color: "#7DA384", letterSpacing: 0.3 },

  searchContainer: { paddingHorizontal: 20, marginTop: 8 },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.inputBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: { fontSize: 18, marginRight: 12, color: PALETTE.subtext },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PALETTE.text,
    paddingVertical: 0,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: PALETTE.subtext,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    textAlign: "center",
  },

  resultsContainer: { paddingHorizontal: 20, marginTop: 16 },
  resultsHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 16,
  },
  resultsList: { marginBottom: 20 },

  spotCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  spotImageContainer: {
    position: "relative",
    height: 160,
  },
  spotImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EEE",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: { fontSize: 20 },
  verifiedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: PALETTE.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  spotInfo: { padding: 16 },
  spotName: {
    fontSize: 20,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 4,
  },
  spotLocation: {
    fontSize: 14,
    color: PALETTE.subtext,
    marginBottom: 8,
  },
  spotDescription: {
    fontSize: 14,
    color: PALETTE.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  spotMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    backgroundColor: PALETTE.externalBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.text,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewContainer: {
    backgroundColor: PALETTE.externalBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: "500",
    color: PALETTE.subtext,
  },
  amenitiesContainer: {
    marginBottom: 12,
  },
  amenitiesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.text,
    marginBottom: 6,
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityTag: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: PALETTE.accent,
    fontWeight: "500",
  },
  moreAmenities: {
    fontSize: 12,
    color: PALETTE.subtext,
    fontStyle: "italic",
    alignSelf: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: PALETTE.externalBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: PALETTE.subtext,
    fontWeight: "500",
  },
  seasonContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  seasonText: {
    fontSize: 12,
    color: "#E65100",
    fontWeight: "500",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: PALETTE.subtext,
    textAlign: "center",
    lineHeight: 22,
  },

  categoriesContainer: { paddingHorizontal: 20, marginTop: 20 },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryCardIcon: { fontSize: 32, marginBottom: 8 },
  categoryCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.text,
    textAlign: "center",
  },
});
