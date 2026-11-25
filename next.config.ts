import type { NextConfig } from "next";

const MODEL_API_URL = process.env.MODEL_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/model/:path*",
        destination: `${MODEL_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
