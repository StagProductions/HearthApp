// src/services/firebase.js
// ─────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project called "Hearth"
// 3. Add an Android app with package: com.hearth.familyplanner
// 4. Download google-services.json → place in project root
// 5. Enable Authentication (Email/Password + Google)
// 6. Create Firestore database in production mode
// 7. Create Realtime Database
// 8. Enable Storage
// 9. Replace the firebaseConfig values below with your own
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDp_yLJSgSyvQ-9jMWV-5252nGwRpONea4",
  authDomain: "hearth-1e8bb.firebaseapp.com",
  projectId: "hearth-1e8bb",
  storageBucket: "hearth-1e8bb.firebasestorage.app",
  messagingSenderId: "884979301139",
  appId: "1:884979301139:web:b3039199614a7856edb8e6",
  measurementId: "G-YJXG1TZGZT"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;
