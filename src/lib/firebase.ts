/**
 * Firebase, used for authentication and nothing else.
 *
 * Initialised lazily and reported on rather than thrown from: a deployment with
 * no Firebase configuration shows a plain "not configured" message instead of a
 * blank page, which is the difference between a demo that degrades and a demo
 * that looks broken.
 */
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseConfigError(): string | null {
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return missing.length > 0 ? `Firebase is not configured: ${missing.join(", ")}` : null;
}

export const isAuthConfigured = firebaseConfigError() === null;

export function firebaseAuth(): Auth {
  const error = firebaseConfigError();
  if (error) throw new Error(error);
  return getAuth(getApps().length > 0 ? getApp() : initializeApp(config));
}
