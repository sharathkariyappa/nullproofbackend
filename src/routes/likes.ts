import express, { Request, Response } from "express";
import { db } from "../firebase.js";
import { Timestamp } from "firebase-admin/firestore";

const router = express.Router();

interface LikeEntry {
  targetWallet: string;
  likerWallet: string;
  createdAt: Date | Timestamp;
}

// Like a user
router.post("/", async (req: Request, res: Response) => {
  try {
    const { targetWallet, likerWallet } = req.body as {
      targetWallet?: string;
      likerWallet?: string;
    };

    if (!targetWallet || !likerWallet) {
      return res.status(400).json({ error: "Missing wallet addresses" });
    }
    if (targetWallet === likerWallet) {
      return res.status(400).json({ error: "You cannot like yourself" });
    }

    const likeRef = db.collection("likes").doc(`${targetWallet}_${likerWallet}`);

    const likeDoc = await likeRef.get();
    if (likeDoc.exists) {
      return res.status(400).json({ error: "You already liked this user" });
    }

    const likeData: LikeEntry = {
      targetWallet,
      likerWallet,
      createdAt: new Date(),
    };

    await likeRef.set(
      likeData as unknown as FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error liking user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get like counts for all wallets
router.get("/counts", async (_req: Request, res: Response) => {
  try {
    const likesSnapshot = await db.collection("likes").get();
    const counts: Record<string, number> = {};

    likesSnapshot.forEach((doc) => {
      const data = doc.data() as LikeEntry;
      const { targetWallet } = data;
      counts[targetWallet] = (counts[targetWallet] || 0) + 1;
    });

    res.json(counts);
  } catch (err) {
    console.error("Error getting like counts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as likesRouter };
