// lib/firestore.ts
import "./gcp-auth";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCP_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT;

if (!PROJECT_ID) {
  console.warn(
    "[firestore] No project id in env (FIREBASE_PROJECT_ID/GCP_PROJECT/GOOGLE_CLOUD_PROJECT)."
  );
}

if (!getApps().length) {
  initializeApp({
    projectId: PROJECT_ID,
    credential: applicationDefault(), // picked up from GOOGLE_APPLICATION_CREDENTIALS (set by lib/gcp-auth)
  });
}

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
