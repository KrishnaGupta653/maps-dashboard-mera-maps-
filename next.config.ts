import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will skip ESLint during the build
  },
  
};

export default nextConfig;
