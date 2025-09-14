import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9Xcd0w7iq8IB3tROmCe2F2b4ysDyAWJE",
  authDomain: "leaflet-565c7.firebaseapp.com",
  projectId: "leaflet-565c7",
  storageBucket: "leaflet-565c7.firebasestorage.app",
  messagingSenderId: "572579443567",
  appId: "1:572579443567:web:3b12f2c7c8788717fa6e9a",
  measurementId: "G-XLKF18VCXQ",
};

export const app = initializeApp(firebaseConfig);

// ✅ Critical: use initializeAuth + AsyncStorage so the session persists across app restarts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

