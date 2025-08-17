import type { Request, Response, NextFunction } from "express";
import { cfg } from "../config.js";

export function cookieOptions(httpOnly = true) {
  return {
    httpOnly,
    secure: cfg.cookie.secure,
    sameSite: cfg.cookie.sameSite,
    domain: cfg.cookie.domain,
    path: "/",
    maxAge: cfg.cookie.maxAgeMs,
  } as const;
}

export function requireGitHub(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[cfg.cookie.name];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  (req as any).githubToken = token;
  next();
}
