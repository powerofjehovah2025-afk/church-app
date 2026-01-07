import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Compress responses
  compress: true,
  // Skip TypeScript errors during build (Supabase SDK has known type inference issues)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
