import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // Frontend calls /api/backend/... and Next proxies to your real backend
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_URL}/:path*`, // e.g. http://localhost:5000
      },
    ];
  }
};

export default nextConfig;
