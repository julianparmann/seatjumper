import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations for reduced memory usage
  output: 'standalone',


  // Optimize images with sharp (more memory efficient than default)
  images: {
    loader: 'default',
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },

  // Experimental features for better memory management
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },

  // Server components external packages
  serverExternalPackages: ['playwright', '@prisma/client'],

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Reduce memory usage in production
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }

    // Ignore certain modules to reduce bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use lighter canvas implementation
      canvas: false,
      encoding: false,
    };

    return config;
  },

  // Compress responses
  compress: true,

  // Disable powered by header
  poweredByHeader: false,

  // Generate build ID based on git commit
  generateBuildId: async () => {
    return process.env.BUILD_ID || 'production-build';
  },
};

export default nextConfig;
