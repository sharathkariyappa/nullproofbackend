import { Router } from "express";
import axios from "axios";
import { cfg } from "../config.js";
import { cookieOptions } from "../middleware/auth.js";

export const authRouter = Router();

/** Step 1: redirect to GitHub */
authRouter.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: cfg.github.clientId,
    redirect_uri: `${cfg.backendUrl}/auth/github/callback`,
    scope: cfg.github.scopes,
    // state: crypto.randomUUID(), // TODO: add CSRF state
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

/** Step 2: callback -> exchange code -> set cookies -> redirect FE */
authRouter.get("/github/callback", async (req, res) => {
  const { code } = req.query as { code?: string };
  if (!code) return res.status(400).send("Missing code");

  const tokenRes = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: cfg.github.clientId,
      client_secret: cfg.github.clientSecret,
      code,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) return res.status(401).send("Token exchange failed");

  // OPTIONAL: store a tiny FE-readable profile cookie for quick UX
  const userRes = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  res.cookie(cfg.cookie.name, accessToken, cookieOptions(true)); // HttpOnly
  res.cookie(
    "github_user",
    JSON.stringify({
      id: userRes.data.id,
      login: userRes.data.login,
      avatar_url: userRes.data.avatar_url,
      name: userRes.data.name,
    }),
    { ...cookieOptions(false) } // FE-readable
  );

  res.redirect(`${cfg.frontendUrl}/dashboard`);
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(cfg.cookie.name, { ...cookieOptions(true), maxAge: 0 });
  res.clearCookie("github_user", { ...cookieOptions(false), maxAge: 0 });
  res.status(204).end();
});
