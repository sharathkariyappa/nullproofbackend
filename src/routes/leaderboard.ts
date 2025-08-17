import express, { Request, Response } from "express";
import { db } from "../firebase";
import { DocumentData, Timestamp } from "firebase-admin/firestore";

const router = express.Router();

// Define leaderboard entry type
interface LeaderboardEntry {
  username: string;
  walletAddress?: string | null;
  score: number;
  tier?: string | null;
  avatar?: string | null;
  githubId?: string | null;
  updatedAt: Date | Timestamp;
  createdAt: Date | Timestamp;
}

type FirestoreData<T> =
  | FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>
  | FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>;


// Get leaderboard (top 10)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const leaderboardRef = db.collection("leaderboard");
    const snapshot = await leaderboardRef.orderBy("score", "desc").limit(10).get();

    const leaderboard: LeaderboardEntry[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as LeaderboardEntry;
      leaderboard.push({
        id: doc.id,
        ...data,
        walletAddress: data.walletAddress || null,
      } as LeaderboardEntry & { id: string });
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Add/Update leaderboard entry
router.post("/", async (req: Request, res: Response) => {
  try {
    const { username, score, tier, avatar, githubId, walletAddress } = req.body;

    if (!username || score === undefined) {
      return res.status(400).json({ error: "Username and score are required" });
    }

    const leaderboardData: LeaderboardEntry = {
      username,
      walletAddress: walletAddress || null,
      score: Number(score),
      tier: tier || null,
      avatar: avatar || null,
      githubId: githubId || null,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    const docRef = db.collection("leaderboard").doc(username);
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      const existingData = existingDoc.data() as LeaderboardEntry;
      leaderboardData.createdAt = existingData?.createdAt || new Date();
      await docRef.set(leaderboardData as FirestoreData<LeaderboardEntry>);

    } else {
      await docRef.set(leaderboardData as FirebaseFirestore.WithFieldValue<DocumentData>);
    }

    res.json({
      success: true,
      message: "Leaderboard updated successfully",
      data: leaderboardData,
    });
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    res.status(500).json({ error: "Failed to update leaderboard" });
  }
});

// Get user's rank
router.get("/rank/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const userDoc = await db.collection("leaderboard").doc(username).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found in leaderboard" });
    }

    const userData = userDoc.data() as LeaderboardEntry;
    const userScore = userData?.score || 0;

    const higherScoresSnapshot = await db
      .collection("leaderboard")
      .where("score", ">", userScore)
      .get();

    const rank = higherScoresSnapshot.size + 1;

    res.json({
      username,
      score: userScore,
      rank,
      tier: userData?.tier,
      totalUsers: (await db.collection("leaderboard").get()).size,
    });
  } catch (error) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({ error: "Failed to fetch user rank" });
  }
});

// Get leaderboard stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("leaderboard").get();
    const totalUsers = snapshot.size;

    let totalScore = 0;
    let highestScore = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() as LeaderboardEntry;
      const score = data.score || 0;
      totalScore += score;
      if (score > highestScore) highestScore = score;
    });

    const averageScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;

    res.json({
      totalUsers,
      averageScore,
      highestScore,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export { router as leaderboardRouter };
