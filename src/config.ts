import "dotenv/config";
import e from "express";

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${name}`);
  return v;
};

export const cfg = {
  env: process.env.NODE_ENV ?? "development",
  frontendUrl: required("FRONTEND_URL"),
  backendUrl: required("BACKEND_URL"),
  cookie: {
    name: process.env.COOKIE_NAME ?? "github_token",
    domain: process.env.COOKIE_DOMAIN ?? "localhost",
    sameSite: (process.env.COOKIE_SAMESITE as "none"|"lax"|"strict") ?? "none",
    secure: (process.env.COOKIE_SECURE ?? "true") === "true",
    maxAgeMs: 1000 * 60 * 60 * 24, // 1 day
  },
  github: {
    clientId: required("GITHUB_CLIENT_ID"),
    clientSecret: required("GITHUB_CLIENT_SECRET"),
    scopes: process.env.GITHUB_SCOPES ?? "read:user user:email",
  },
  rpcHttpUrl: required("RPC_HTTP_URL"),
  erc20List: (process.env.ERC20_LIST ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean),
  scoringUrl: process.env.SCORING_URL,
    firebase_api_key:process.env.FIREBASE_API_KEY,
    firebase_auth_domain:process.env.FIREBASE_AUTH_DOMAIN,
    firebase_project_id:process.env.FIREBASE_PROJECT_ID,
    firebase_storage_bucket:process.env.FIREBASE_STORAGE_BUCKET,
    firebase_messaging_sender_id:process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebase_app_id:process.env.FIREBASE_APP_ID,
    measurementid:process.env.MEASUREMENTID,
    privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    email: process.env.CLIENT_EMAIL

};
