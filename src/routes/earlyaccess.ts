// src/routes/earlyAccess.ts
import { Router } from "express";
import { db } from "../firebase.js";

export const earlyAccessRouter = Router();

earlyAccessRouter.post("/", async (req, res) => {
  try {
    const { email, walletAddress } = req.body;

    if (!email || !walletAddress) {
      return res.status(400).json({ error: "Email and walletAddress are required" });
    }

    const docRef = db.collection("earlyAccess").doc();
    await docRef.set({
      email,
      walletAddress,
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: "Early access registered!" });
  } catch (error: any) {
    console.error("Error saving early access:", error);
    res.status(500).json({ error: "Failed to save early access" });
  }
});
