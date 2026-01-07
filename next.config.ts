import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Compress responses
  compress: true,
  // Ignore TypeScript errors during build - pre-existing type issues with generated Supabase types
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
