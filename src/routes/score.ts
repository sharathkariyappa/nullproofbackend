import { Router } from "express";
import { requireGitHub } from "../middleware/auth.js";
import { fetchGitHubContributorData } from "../services/github.js";
import { fetchOnchainStats } from "../services/onchain.js";
import { flaskModelScore } from "../services/scoring.js";

export const scoreRouter = Router();

/**
 * POST /api/score
 * body: { githubUsername: string, address: string, useExternalModel?: boolean }
 */
scoreRouter.post("/", requireGitHub, async (req, res) => {
  const { githubUsername, address, useExternalModel } = req.body || {};
  if (!githubUsername || !address) {
    return res.status(400).json({ error: "githubUsername and address required" });
  }

  const token = (req as any).githubToken as string;

  try {
    // Fetch both in parallel
    const [gh, oc] = await Promise.all([
      fetchGitHubContributorData(token, githubUsername),
      fetchOnchainStats(address)
    ]);

    if (useExternalModel) {
      try {
        const model = await flaskModelScore(gh, oc);
        return res.json({ model });
      } catch {
        return res.status(500).json({ error: "External model failed" });
      }
    }

    return res.json({ github: gh, onchain: oc });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
