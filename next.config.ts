// next.config.ts
import type { NextConfig } from "next";

const raw = process.env.BACKEND_URL ?? "http://localhost:5000";
const backend = raw.replace(/\/$/, ""); 

if (!/^https?:\/\//.test(backend)) {
  throw new Error(
    `BACKEND_URL must include protocol, e.g. "http://localhost:5000". Got: ${backend}`
  );
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
