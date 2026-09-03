// Connects to the SAME Firebase project the Discord bot already uses,
// via the FIREBASE_KEY env var (the service account credentials).
//
// FIREBASE_KEY should hold the full service account JSON, either:
//   1) pasted as a single-line JSON string, or
//   2) base64-encoded (safer for pasting into Render's env var UI)
// This file handles both — see README for how to get this value from
// the same place your bot's .env already has it.

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_KEY;
  if (!raw) {
    throw new Error("FIREBASE_KEY env var is not set");
  }

  // Try plain JSON first, then fall back to base64-decoded JSON.
  try {
    return JSON.parse(raw);
  } catch {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded);
  }
}

function getFirebaseApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = loadServiceAccount();
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore(getFirebaseApp());
