import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce DevTools communication issues
  experimental: {
    // Disable some experimental features that can cause DevTools issues
    optimizePackageImports: [],
  },
  // Improve development experience
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce DevTools noise in development
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

export default nextConfig; 