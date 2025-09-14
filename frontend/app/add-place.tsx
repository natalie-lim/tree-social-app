import { ThemedText } from '@/components/themed-text';
import { auth } from '@/config/firebase';
import { firestoreService } from '@/services/firestore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SpotFormData {
  name: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: {
      latitude: string;
      longitude: string;
    };
  };
  amenities: string[];
  bestTimeToVisit: string[];
  difficulty: string;
  distance: string;
  duration: string;
  elevation: string;
  website: string;
  tags: string[];
  photoUrl: string;
}

const CATEGORIES = [
  'parks_nature',
  'historical',
  'recreation',
  'cultural',
  'other'
];

const DIFFICULTY_LEVELS = [
  'easy',
  'moderate',
  'hard',
  'varies'
];

const SEASONS = [
  'spring',
  'summer',
  'fall',
  'winter'
];

const COMMON_AMENITIES = [
  'parking',
  'restrooms',
  'visitor_center',
  'trails',
  'picnic_areas',
  'camping',
  'wifi',
  'food_available',
  'gift_shop',
  'accessibility'
];

const COMMON_TAGS = [
  'hiking',
  'photography',
  'nature',
  'scenic_views',
  'wildlife',
  'family_friendly',
  'dog_friendly',
  'free_entry',
  'historic',
  'water_activities'
];

export default function AddPlacePage() {
  const [formData, setFormData] = useState<SpotFormData>({
    name: '',
    description: '',
    category: 'parks_nature',
    location: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    amenities: [],
    bestTimeToVisit: [],
    difficulty: 'varies',
    distance: '',
    duration: '',
    elevation: '',
    website: '',
    tags: [],
    photoUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof SpotFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayToggle = (field: 'amenities' | 'bestTimeToVisit' | 'tags', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a place name');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.location.address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to add a place');
        return;
      }

      const spotData = {
        ...formData,
        location: {
          ...formData.location,
          coordinates: {
            latitude: parseFloat(formData.location.coordinates.latitude) || 0,
            longitude: parseFloat(formData.location.coordinates.longitude) || 0
          }
        },
        averageRating: 0,
        reviewCount: 0,
        totalRatings: 0,
        isVerified: false,
        createdBy: currentUser.uid,
        source: 'USER_ADDED',
        photos: formData.photoUrl ? [{
          url: formData.photoUrl,
          caption: formData.name,
          credit: 'User Upload'
        }] : []
      };

      await firestoreService.create('spots', spotData);
      
      Alert.alert(
        'Success!', 
        'Place added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert('Error', 'Failed to add place. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Add New Place</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Basic Information */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Place Name *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter place name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Description *</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Describe this place..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Category</ThemedText>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((category) => (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryButton,
                        formData.category === category && styles.categoryButtonSelected
                      ]}
                      onPress={() => handleInputChange('category', category)}
                    >
                      <ThemedText style={[
                        styles.categoryButtonText,
                        formData.category === category && styles.categoryButtonTextSelected
                      ]}>
                        {category.replace(/_/g, ' ').toUpperCase()}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Location</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Address *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.location.address}
                  onChangeText={(value) => handleInputChange('location.address', value)}
                  placeholder="Enter address"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.coordinatesRow}>
                <View style={styles.coordinateInput}>
                  <ThemedText style={styles.label}>Latitude</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.location.coordinates.latitude}
                    onChangeText={(value) => handleInputChange('location.coordinates.latitude', value)}
                    placeholder="0.000000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.coordinateInput}>
                  <ThemedText style={styles.label}>Longitude</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.location.coordinates.longitude}
                    onChangeText={(value) => handleInputChange('location.coordinates.longitude', value)}
                    placeholder="0.000000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Activity Details */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Activity Details</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Difficulty</ThemedText>
                <View style={styles.difficultyRow}>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <Pressable
                      key={level}
                      style={[
                        styles.difficultyButton,
                        formData.difficulty === level && styles.difficultyButtonSelected
                      ]}
                      onPress={() => handleInputChange('difficulty', level)}
                    >
                      <ThemedText style={[
                        styles.difficultyButtonText,
                        formData.difficulty === level && styles.difficultyButtonTextSelected
                      ]}>
                        {level.toUpperCase()}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailInput}>
                  <ThemedText style={styles.label}>Distance</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.distance}
                    onChangeText={(value) => handleInputChange('distance', value)}
                    placeholder="e.g., 2 miles"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.detailInput}>
                  <ThemedText style={styles.label}>Duration</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.duration}
                    onChangeText={(value) => handleInputChange('duration', value)}
                    placeholder="e.g., 2 hours"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Elevation</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.elevation}
                  onChangeText={(value) => handleInputChange('elevation', value)}
                  placeholder="e.g., 1200 ft"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Best Time to Visit */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Best Time to Visit</ThemedText>
              <View style={styles.seasonsGrid}>
                {SEASONS.map((season) => (
                  <Pressable
                    key={season}
                    style={[
                      styles.seasonButton,
                      formData.bestTimeToVisit.includes(season) && styles.seasonButtonSelected
                    ]}
                    onPress={() => handleArrayToggle('bestTimeToVisit', season)}
                  >
                    <ThemedText style={[
                      styles.seasonButtonText,
                      formData.bestTimeToVisit.includes(season) && styles.seasonButtonTextSelected
                    ]}>
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Amenities</ThemedText>
              <View style={styles.amenitiesGrid}>
                {COMMON_AMENITIES.map((amenity) => (
                  <Pressable
                    key={amenity}
                    style={[
                      styles.amenityButton,
                      formData.amenities.includes(amenity) && styles.amenityButtonSelected
                    ]}
                    onPress={() => handleArrayToggle('amenities', amenity)}
                  >
                    <ThemedText style={[
                      styles.amenityButtonText,
                      formData.amenities.includes(amenity) && styles.amenityButtonTextSelected
                    ]}>
                      {amenity.replace(/_/g, ' ').toUpperCase()}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
              <View style={styles.tagsGrid}>
                {COMMON_TAGS.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagButton,
                      formData.tags.includes(tag) && styles.tagButtonSelected
                    ]}
                    onPress={() => handleArrayToggle('tags', tag)}
                  >
                    <ThemedText style={[
                      styles.tagButtonText,
                      formData.tags.includes(tag) && styles.tagButtonTextSelected
                    ]}>
                      {tag.replace(/_/g, ' ').toUpperCase()}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Additional Information</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Website</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.website}
                  onChangeText={(value) => handleInputChange('website', value)}
                  placeholder="https://example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Photo URL</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.photoUrl}
                  onChangeText={(value) => handleInputChange('photoUrl', value)}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <Pressable
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.submitButtonText}>
                  {isSubmitting ? 'Adding Place...' : 'Add Place'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6FA076',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryButtonSelected: {
    backgroundColor: '#6FA076',
    borderColor: '#6FA076',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  difficultyButtonSelected: {
    backgroundColor: '#6FA076',
    borderColor: '#6FA076',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  difficultyButtonTextSelected: {
    color: '#FFFFFF',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailInput: {
    flex: 1,
  },
  seasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  seasonButtonSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  seasonButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  seasonButtonTextSelected: {
    color: '#4CAF50',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  amenityButtonSelected: {
    backgroundColor: '#6FA076',
    borderColor: '#6FA076',
  },
  amenityButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  amenityButtonTextSelected: {
    color: '#FFFFFF',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tagButtonSelected: {
    backgroundColor: '#6FA076',
    borderColor: '#6FA076',
  },
  tagButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  tagButtonTextSelected: {
    color: '#FFFFFF',
  },
  submitSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#6FA076',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
