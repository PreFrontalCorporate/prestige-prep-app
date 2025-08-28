// lib/firestore.ts
// Server-only Firestore singleton via firebase-admin.
// Uses ADC on GCE/Cloud Run if GOOGLE_APPLICATION_CREDENTIALS isn't provided.

import 'server-only';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getOrInitApp() {
  const apps = getApps();
  if (apps.length) return apps[0];

  return initializeApp({
    // On the VM we rely on ADC; locally you can also set GOOGLE_APPLICATION_CREDENTIALS
    credential: applicationDefault(),
  });
}

const app = getOrInitApp();
export const db = getFirestore(app);
