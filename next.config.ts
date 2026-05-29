import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "**.archive.org" },
      { protocol: "https", hostname: "www.soundhelix.com" },
    ],
    // Phase 20C: Aggressive image optimization for Lighthouse
    deviceSizes: [430, 640, 768, 1024],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: [
      "@tabler/icons-react",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "zustand",
    ],
    // Phase 20C: Bundle governance
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Phase 20C: Bundle splitting & production optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
  env: {
    NEXT_PUBLIC_CF_WORKER_URL: process.env.NEXT_PUBLIC_CF_WORKER_URL ?? "",
  },
  // Phase 20C: Webpack chunk strategy for bundle governance
  webpack(config, { isServer }) {
    if (!isServer) {
      // Split large vendor chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Dedicated audio chunk (Web Audio API heavy)
          audio: {
            test: /[\\/]src[\\/]lib[\\/]audio[\\/]/,
            name: "chunk-audio",
            priority: 40,
            reuseExistingChunk: true,
          },
          // Dedicated visualization chunk
          visualization: {
            test: /[\\/](VisualizationAnalyzer|VisualizerDisplay|Visualizer)[\\/]/,
            name: "chunk-viz",
            priority: 35,
            reuseExistingChunk: true,
          },
          // Supabase chunk (lazy-loaded)
          supabase: {
            test: /[\\/]@supabase[\\/]/,
            name: "chunk-supabase",
            priority: 30,
            reuseExistingChunk: true,
          },
          // Icons chunk (large package, rarely changes)
          icons: {
            test: /[\\/]@tabler[\\/]/,
            name: "chunk-icons",
            priority: 25,
            reuseExistingChunk: true,
          },
          // Serwist SW (separate from main bundle)
          serwist: {
            test: /[\\/]serwist[\\/]/,
            name: "chunk-sw",
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
