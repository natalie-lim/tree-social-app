// Sample data structure for your nature tracking app
// This shows the expected data format for each collection

export const sampleUser = {
  userId: "user123",
  displayName: "Nature Explorer",
  email: "explorer@example.com",
  profilePhoto: "https://example.com/photo.jpg",
  bio: "Love hiking and discovering new trails!",
  location: "Pacific Northwest",
  followers: ["user456", "user789"],
  following: ["user456", "user101"],
  followerCount: 2,
  followingCount: 2,
  totalSpots: 15,
  totalReviews: 23,
  averageRating: 4.2,
  badges: ["trail_blazer", "photographer", "early_adopter"],
  joinedAt: "2024-01-15T00:00:00Z",
  isVerified: false
};

export const sampleSpot = {
  name: "Eagle Peak Trail",
  description: "Challenging hike with stunning mountain views",
  category: "hikes_trails",
  location: {
    name: "Mount Rainier National Park",
    coordinates: {
      latitude: 46.8523,
      longitude: -121.7603
    },
    address: "Mount Rainier National Park, WA"
  },
  difficulty: "hard", // easy, moderate, hard, expert
  duration: "6-8 hours",
  distance: "12.5 miles",
  elevation: "3,200 ft gain",
  photos: [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  tags: ["mountain_views", "wildlife", "challenging", "day_hike"],
  amenities: ["parking", "restrooms", "water"],
  bestTimeToVisit: ["spring", "summer", "fall"],
  createdBy: "user123",
  reviewCount: 45,
  averageRating: 4.6,
  totalRatings: 45,
  isVerified: true,
  createdAt: "2024-01-15T00:00:00Z"
};

export const sampleReview = {
  userId: "user456",
  spotId: "spot123",
  rating: 5,
  title: "Amazing views!",
  content: "This trail exceeded my expectations. The views from the summit are breathtaking!",
  photos: ["https://example.com/review-photo.jpg"],
  visitDate: "2024-03-15",
  difficulty: "hard",
  crowdLevel: "moderate", // low, moderate, high
  weatherConditions: "sunny",
  tips: "Bring plenty of water and start early!",
  helpful: 12,
  reportCount: 0,
  isVerified: false,
  createdAt: "2024-03-16T00:00:00Z"
};

export const sampleActivity = {
  userId: "user123",
  type: "spot_visit", // spot_visit, review_posted, list_created, photo_shared
  spotId: "spot123",
  title: "Completed Eagle Peak Trail",
  description: "What an incredible hike! 12.5 miles of pure adventure.",
  photos: ["https://example.com/activity-photo.jpg"],
  data: {
    rating: 5,
    duration: "7 hours",
    companions: 2
  },
  likes: 25,
  comments: 8,
  isPublic: true,
  createdAt: "2024-03-15T00:00:00Z"
};

export const sampleList = {
  userId: "user123",
  name: "Best Mountain Hikes",
  description: "My favorite challenging mountain trails in the Pacific Northwest",
  category: "hikes_trails",
  spotIds: ["spot123", "spot456", "spot789"],
  spotCount: 3,
  coverPhoto: "https://example.com/list-cover.jpg",
  isPublic: true,
  followers: ["user456", "user789"],
  followerCount: 2,
  tags: ["mountains", "challenging", "pacific_northwest"],
  createdAt: "2024-02-01T00:00:00Z"
};

export const sampleComment = {
  userId: "user456",
  activityId: "activity123",
  content: "Looks amazing! Adding this to my bucket list.",
  likes: 3,
  replies: [],
  createdAt: "2024-03-16T00:00:00Z"
};

// Categories with their specific fields
export const categoryFields = {
  hikes_trails: {
    difficulty: ["easy", "moderate", "hard", "expert"],
    trailType: ["loop", "out_and_back", "point_to_point"],
    surface: ["dirt", "rock", "paved", "mixed"],
    features: ["waterfall", "lake", "summit", "wildlife", "flowers"]
  },
  parks_nature: {
    parkType: ["national", "state", "local", "private"],
    facilities: ["camping", "picnic", "playground", "visitor_center"],
    activities: ["hiking", "fishing", "boating", "wildlife_viewing"]
  },
  adventure_activities: {
    activityType: ["climbing", "kayaking", "skiing", "biking", "camping"],
    skillLevel: ["beginner", "intermediate", "advanced", "expert"],
    equipment: ["rental_available", "bring_own", "guided_tours"]
  },
  casual_outdoors: {
    setting: ["urban_park", "beach", "garden", "scenic_drive"],
    accessibility: ["wheelchair_accessible", "family_friendly", "pet_friendly"],
    facilities: ["parking", "restrooms", "food", "gift_shop"]
  },
  wildlife_logs: {
    species: ["birds", "mammals", "reptiles", "insects", "marine"],
    season: ["spring", "summer", "fall", "winter"],
    timeOfDay: ["dawn", "morning", "afternoon", "dusk", "night"],
    behavior: ["feeding", "nesting", "migration", "mating"]
  }
};
