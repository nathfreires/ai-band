import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(config.apiKey && config.databaseURL);

let app: FirebaseApp | null = null;
let db: Database | null = null;

if (firebaseReady) {
  app = initializeApp(config);
  db = getDatabase(app);
} else {
  // Keep the app usable in demo mode without env vars. Real sync is disabled.
  console.warn(
    "Firebase env vars missing. Realtime sync is off. /host?demo=1 still works.",
  );
}

export { app, db };
