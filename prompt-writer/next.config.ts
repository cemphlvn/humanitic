import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generate": ["./docs/**/*"],
  },
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
