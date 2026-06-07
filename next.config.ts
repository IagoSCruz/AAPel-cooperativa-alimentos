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
  output: "standalone",

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
