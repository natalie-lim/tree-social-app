// app/map.tsx
import { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";

import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

type Place = { id: string; title?: string; latitude: number; longitude: number };

const COLORS = {
  bg: "#FFF6EC",     // soft cream
  brand: "#2F4A43",  // deep green
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

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "spots"),
      (snap) => {
        const pts: Place[] = snap.docs
          .map((d) => {
            const x = d.data() as any;
            const lat = Number(x?.location?.coordinates?.latitude);
            const lng = Number(x?.location?.coordinates?.longitude);
            return {
              id: d.id,
              title: x?.location?.name ?? "Untitled",
              latitude: lat,
              longitude: lng,
            };
          })
          .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
        setPlaces(pts);
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
    const first = places[0];
    return first
      ? { latitude: first.latitude, longitude: first.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
      : { latitude: 39.9526, longitude: -75.1652, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }, [places]);

  return (
    <View style={styles.screen}>
      {/* Custom top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} paddingTop={40} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.brand}>leaflet</Text>
      </View>


      {/* Map / Loader */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          customMapStyle={COLORFUL_MAP_STYLE}
          initialRegion={initialRegion}
        >
          {places.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={p.title}
            >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Image
                  source={require("../assets/images/mapleaf.png")}
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
    backgroundColor: COLORS.bg,          // full cream background
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,    // full-width border
    flexDirection: "row",
    alignItems: "center",                // vertically center back + text
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
  { featureType: "poi.park", stylers: [{ color: "#CDEBC0" }, { visibility: "on" }] },
  { featureType: "landscape.natural", stylers: [{ color: "#E5F5D7" }] },

  // --- Highways (keep visible, but hide shields) ---
  { featureType: "road.highway", stylers: [{ color: "#F7C59F" }, { visibility: "on" }] },
  {
    featureType: "road.highway",
    elementType: "labels.icon", // highway shield/number
    stylers: [{ visibility: "off" }]
  },

  // --- Arterial roads (hidden) ---
  { featureType: "road.arterial", stylers: [{ visibility: "off" }] },

  // --- Local roads (hidden) ---
  { featureType: "road.local", stylers: [{ visibility: "off" }] },

  // --- Admin boundaries & labels ---
  {
    featureType: "administrative.locality", // city names
    elementType: "labels.text.fill",
    stylers: [{ color: "#2F4A43" }, { visibility: "on" }]
  },
  {
    featureType: "administrative.neighborhood", // small towns/areas
    elementType: "labels.text.fill",
    stylers: [{ color: "#2F4A43" }, { visibility: "on" }]
  },
  {
    featureType: "administrative.province",
    elementType: "labels.text.fill",
    stylers: [{ color: "#334E68" }, { visibility: "on" }]
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2B2D42" }, { visibility: "on" }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }]
  },

  // --- Hide clutter ---
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] }
];
