import { Router } from "express";
import { requireGitHub } from "../middleware/auth";
import { fetchGitHubContributorData } from "../services/github";

export const githubRouter = Router();

/** /api/github/stats?username=... */
githubRouter.get("/stats", requireGitHub, async (req, res) => {
  const username = String(req.query.username || "");
  if (!username) return res.status(400).json({ error: "username required" });

  const token = (req as any).githubToken as string;
  const stats = await fetchGitHubContributorData(token, username);
  res.json(stats);
});

/** Convenience: /api/github/me */
githubRouter.get("/me", requireGitHub, async (req, res) => {
  res.json({ ok: true });
});
