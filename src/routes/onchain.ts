import { Router } from "express";
import { fetchOnchainStats } from "../services/onchain";

export const onchainRouter = Router();

/** /api/onchain/stats/:address */
onchainRouter.get("/stats/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const data = await fetchOnchainStats(address);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Invalid address" });
  }
});
