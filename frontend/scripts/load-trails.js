// scripts/load_trails.js
require("dotenv").config();
const admin = require("firebase-admin");
const axios = require("axios");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// 🔑 Your NPS API key (set in .env at project root)
const NPS_API_KEY = process.env.NPS_API_KEY;

// Fetch parks from NPS API
async function fetchNpsParks() {
  const url = `https://developer.nps.gov/api/v1/parks?limit=50&api_key=${NPS_API_KEY}`;
  console.log("📡 Fetching from:", url);

  const res = await axios.get(url);
  return res.data.data;
}

// Normalize into consistent schema
function normalizeTrail(raw) {
  return {
    name: raw.fullName || raw.name || "Unnamed Park",
    description: raw.description || "",
    category: "parks_nature",
    location: {
      name: raw.fullName || raw.name,
      coordinates: {
        latitude: raw.latitude ? Number(raw.latitude) : null,
        longitude: raw.longitude ? Number(raw.longitude) : null,
      },
      address: `${raw.states || "Unknown"}, USA`,
    },
    difficulty: "varies",
    photos: raw.images ? raw.images.map((img) => img.url) : [],
    tags: raw.topics ? raw.topics.map((t) => t.name) : [],
    amenities: raw.amenities ? raw.amenities.map((a) => a.name) : [],
    createdBy: "nps_import",
    reviewCount: 0,
    averageRating: 0,
    totalRatings: 0,
    isVerified: true,
    source: "NPS",
    createdAt: new Date(),
  };
}

// Load into Firestore
async function loadTrails() {
  try {
    const rawData = await fetchNpsParks();
    const trails = rawData.map(normalizeTrail);

    const batch = db.batch();
    trails.forEach((trail) => {
      const ref = db.collection("trails").doc();
      batch.set(ref, trail);
    });

    await batch.commit();
    console.log(`Loaded ${trails.length} parks/trails into Firestore`);
  } catch (err) {
    console.error("Error loading trails:", err.message);
  }
}

loadTrails();
