import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase server action body size limit for file uploads (up to 100 MB)
    // This handles large file uploads from the web interface
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
