// app/map.tsx
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { collection, onSnapshot } from "firebase/firestore";
import { Spot } from "../../components/SpotCard";
import { db } from "../../config/firebase";

type Place = {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
};

const COLORS = {
  bg: "#FFF6EC", // soft cream
  brand: "#2F4A43", // deep green
  text: "#222326",
  sub: "#6F7276",
  border: "#E3E6E8",
};

export default function MapScreen() {
  const nav = useNavigation();
  useLayoutEffect(() => {
    // Hide the default (black) header
    nav.setOptions?.({ headerShown: false });
  }, [nav]);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "spots"),
      (snap) => {
        const spotData: Spot[] = snap.docs
          .map((d) => {
            const x = d.data() as any;
            const lat = Number(x?.location?.coordinates?.latitude);
            const lng = Number(x?.location?.coordinates?.longitude);

            // Only include spots with valid coordinates
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return null;
            }

            return {
              id: d.id,
              name: x?.name ?? "Untitled",
              description: x?.description ?? "",
              category: x?.category ?? "",
              location: {
                address: x?.location?.address ?? "",
                coordinates: {
                  latitude: lat,
                  longitude: lng,
                },
              },
              photos: x?.photos ?? [],
              amenities: x?.amenities ?? [],
              averageRating: x?.averageRating ?? 0,
              reviewCount: x?.reviewCount ?? 0,
              totalRatings: x?.totalRatings ?? 0,
              bestTimeToVisit: x?.bestTimeToVisit ?? [],
              difficulty: x?.difficulty ?? "varies",
              distance: x?.distance ?? "",
              duration: x?.duration ?? "",
              elevation: x?.elevation ?? "",
              isVerified: x?.isVerified ?? false,
              npsCode: x?.npsCode,
              website: x?.website,
              tags: x?.tags ?? [],
              createdAt: x?.createdAt ?? new Date(),
              createdBy: x?.createdBy ?? "",
              source: x?.source ?? "USER_ADDED",
              updatedAt: x?.updatedAt ?? new Date(),
            } as Spot;
          })
          .filter((spot): spot is Spot => spot !== null);
        setSpots(spotData);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const initialRegion = useMemo(() => {
    const first = spots[0];
    return first
      ? {
          latitude: first.location.coordinates.latitude,
          longitude: first.location.coordinates.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : {
          latitude: 39.9526,
          longitude: -75.1652,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
  }, [spots]);

  return (
    <View style={styles.screen}>
  

      {/* Map / Loader */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          customMapStyle={COLORFUL_MAP_STYLE}
          initialRegion={initialRegion}
        >
          {spots.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: spot.location.coordinates.latitude,
                longitude: spot.location.coordinates.longitude,
              }}
              title={spot.name}
              onPress={() => {
                router.push({
                  pathname: "/spot-detail",
                  params: { spotData: JSON.stringify(spot) },
                });
              }}
            >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Image
                  source={require("../../assets/images/mapleaf.png")}
                  style={{ width: 50, height: 50, tintColor: "#2F8C46" }} // bigger + green tint
                  resizeMode="contain"
                />
              </View>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    height: 100,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg, // full cream background
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // full-width border
    flexDirection: "row",
    alignItems: "center", // vertically center back + text
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.brand,
    paddingTop: 40,
  },
  rightIcons: { width: 32, alignItems: "flex-end" }, // keeps brand centered
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});

// leafyMapStyle.ts
export const COLORFUL_MAP_STYLE = [
  // --- Base land & water ---
  { featureType: "landscape", stylers: [{ color: "#FFF6EC" }] },
  { featureType: "water", stylers: [{ color: "#A4DDED" }] },

  // --- Parks & natural areas ---
  {
    featureType: "poi.park",
    stylers: [{ color: "#CDEBC0" }, { visibility: "on" }],
  },
  { featureType: "landscape.natural", stylers: [{ color: "#E5F5D7" }] },

  // --- Highways (keep visible, but hide shields) ---
  {
    featureType: "road.highway",
    stylers: [{ color: "#F7C59F" }, { visibility: "on" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.icon", // highway shield/number
    stylers: [{ visibility: "off" }],
  },

  // --- Arterial roads (hidden) ---
  { featureType: "road.arterial", stylers: [{ visibility: "off" }] },

  // --- Local roads (hidden) ---
  { featureType: "road.local", stylers: [{ visibility: "off" }] },

  // --- Admin boundaries & labels ---
  {
    featureType: "administrative.locality", // city names
    elementType: "labels.text.fill",
    stylers: [{ color: "#2F4A43" }, { visibility: "on" }],
  },
  {
    featureType: "administrative.neighborhood", // small towns/areas
    elementType: "labels.text.fill",
    stylers: [{ color: "#2F4A43" }, { visibility: "on" }],
  },
  {
    featureType: "administrative.province",
    elementType: "labels.text.fill",
    stylers: [{ color: "#334E68" }, { visibility: "on" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2B2D42" }, { visibility: "on" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },

  // --- Hide clutter ---
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
