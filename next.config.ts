import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Card/post PNGs are produced client-side; render routes must never be cached stale.
  async headers() {
    return [{ source: "/render/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
