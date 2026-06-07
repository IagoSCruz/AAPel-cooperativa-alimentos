import type { NextConfig } from "next";

const appHostname = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker deploys.
  // Produces .next/standalone/server.js — runs without node_modules at runtime.
  // On Vercel, the platform handles output itself, so "standalone" must be
  // disabled — otherwise Vercel looks for a static "public" output dir and fails.
  output: process.env.VERCEL ? undefined : "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(appHostname
        ? [{ protocol: "https" as const, hostname: appHostname }]
        : []),
    ],
  },
};

export default nextConfig;
