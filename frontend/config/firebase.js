// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9Xcd0w7iq8IB3tROmCe2F2b4ysDyAWJE",
  authDomain: "leaflet-565c7.firebaseapp.com",
  projectId: "leaflet-565c7",
  storageBucket: "leaflet-565c7.firebasestorage.app",
  messagingSenderId: "572579443567",
  appId: "1:572579443567:web:3b12f2c7c8788717fa6e9a",
  measurementId: "G-XLKF18VCXQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Initialize Analytics only in web environment
let analytics = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

// Export the services
export { auth, db, storage, functions, analytics };
export default app;