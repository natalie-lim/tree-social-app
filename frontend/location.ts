import * as Location from "expo-location";


export type CurrentPlace = {
 coords: { latitude: number; longitude: number };
 city?: string;
 region?: string; // state / province
 country?: string;
};


export async function getCurrentPlace(): Promise<CurrentPlace | null> {
 // Ask permission
 const { status } = await Location.requestForegroundPermissionsAsync();
 if (status !== "granted") return null;


 // Try a fast cached position first
 const cached = await Location.getLastKnownPositionAsync();
 const position =
   cached ??
   (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));


 const { latitude, longitude } = position.coords;


 // Reverse geocode to city/state
 const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });


 return {
   coords: { latitude, longitude },
   city: addr?.city ?? addr?.district ?? undefined,
   region: addr?.region ?? undefined,
   country: addr?.country ?? undefined,
 };
}



