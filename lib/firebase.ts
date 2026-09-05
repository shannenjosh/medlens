/**
 * lib/firebase.ts
 *
 * Initialises the Firebase app and exports a Firestore database instance.
 * All configuration values are read from NEXT_PUBLIC_* environment variables
 * defined in .env.local — never hard-coded here.
 *
 * Usage:
 *   import { db } from "@/lib/firebase";
 *   import { doc, setDoc } from "firebase/firestore";
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent duplicate initialisation when Next.js hot-reloads modules in dev
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/** Firestore database instance — import this wherever you need Firestore. */
export const db = getFirestore(app);

/** Helper to check if Firebase is configured with required environment variables */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}
