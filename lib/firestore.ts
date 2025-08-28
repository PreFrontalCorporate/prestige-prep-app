// lib/firestore.ts
import 'server-only';
import * as admin from 'firebase-admin';

type SA = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function getServiceAccount(): SA | null {
  const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const rawB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  try {
    if (rawJson && rawJson.trim().startsWith('{')) {
      return JSON.parse(rawJson);
    }
    if (rawB64 && rawB64.trim().length > 0) {
      const json = Buffer.from(rawB64, 'base64').toString('utf8');
      return JSON.parse(json);
    }
  } catch {}
  return null;
}

const sa = getServiceAccount();

const projectId =
  sa?.project_id ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCS_PROJECT;

const globalAny = globalThis as any;

export const db =
  globalAny.__pp_db ||
  (() => {
    if (!admin.apps.length) {
      if (sa) {
        admin.initializeApp({
          credential: admin.credential.cert({
            clientEmail: sa.client_email,
            privateKey: sa.private_key,
            projectId,
          }),
          projectId,
        });
      } else {
        // Fallback (ADC) — won’t work on Vercel unless you provide a key file
        admin.initializeApp({ projectId });
      }
    }
    const firestore = admin.firestore();
    globalAny.__pp_db = firestore;
    return firestore;
  })();
