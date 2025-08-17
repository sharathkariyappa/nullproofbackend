import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { cfg } from "./config.js";

// Only service account fields required
const serviceAccount = {
  projectId: cfg.firebase_project_id,
  clientEmail: cfg.email,
  privateKey: cfg.privateKey,
};

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore(app);
