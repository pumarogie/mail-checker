import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  experimental: {
    // Increase server action body size limit for file uploads (up to 100 MB)
    // This handles large file uploads from the web interface
    // Works in conjunction with nginx proxy configuration
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
