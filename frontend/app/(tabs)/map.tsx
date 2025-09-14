
import * as Location from "expo-location";
import { router, useNavigation } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { CuteLoading } from "@/components/CuteLoading";

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
    nav.setOptions?.({ headerShown: false });
  }, [nav]);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  // 👇 user location state
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // 🔹 Ask for permission and read current position
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced,
        });

        const region: Region = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        setUserRegion(region);

        // If map already mounted, animate to user
        if (mapRef.current) {
          mapRef.current.animateToRegion(region, 600);
        }
      } catch {
        // ignore, we’ll fall back to spots/default
      }
    })();
  }, []);

  // 🔹 Firestore spots
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "spots"),
      (snap) => {
        const spotData: Spot[] = snap.docs
          .map((d) => {
            const x = d.data() as any;
            const lat = Number(x?.location?.coordinates?.latitude);
            const lng = Number(x?.location?.coordinates?.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            return {
              id: d.id,
              name: x?.name ?? "Untitled",
              description: x?.description ?? "",
              category: x?.category ?? "",
              location: {
                address: x?.location?.address ?? "",
                coordinates: { latitude: lat, longitude: lng },
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
          .filter((s): s is Spot => s !== null);

        setSpots(spotData);
        setLoading(false);

        // If we don’t have user location, center on first spot once
        if (!userRegion && spotData.length && mapRef.current) {
          const first = spotData[0].location.coordinates;
          mapRef.current.animateToRegion(
            {
              latitude: first.latitude,
              longitude: first.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            },
            600
          );
        }
      },
      (err) => {
        console.warn("Firestore error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [userRegion]);

  const initialRegion = useMemo<Region>(() => {
    if (userRegion) return userRegion;
    const first = spots[0];
    if (first) {
      return {
        latitude: first.location.coordinates.latitude,
        longitude: first.location.coordinates.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return {
      latitude: 39.9526,
      longitude: -75.1652,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [userRegion, spots]);

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.center}>
          <CuteLoading message="Loading map..." size="large" />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          customMapStyle={COLORFUL_MAP_STYLE}
          initialRegion={initialRegion}
          showsUserLocation
          followsUserLocation={false}
          showsMyLocationButton={Platform.OS === "android"}
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
                  style={{ width: 50, height: 50, tintColor: "#2F8C46" }}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});

// leafyMapStyle.ts (kept inline, as in your file)
export const COLORFUL_MAP_STYLE = [
  { featureType: "landscape", stylers: [{ color: "#FFF6EC" }] },
  { featureType: "water", stylers: [{ color: "#A4DDED" }] },
  { featureType: "poi.park", stylers: [{ color: "#CDEBC0" }, { visibility: "on" }] },
  { featureType: "landscape.natural", stylers: [{ color: "#E5F5D7" }] },
  { featureType: "road.highway", stylers: [{ color: "#F7C59F" }, { visibility: "on" }] },
  { featureType: "road.highway", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", stylers: [{ visibility: "off" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2F4A43" }, { visibility: "on" }],
  },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
