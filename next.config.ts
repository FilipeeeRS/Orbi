import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // O projeto está numa pasta do OneDrive: o cache em disco do Turbopack às vezes serve CSS antigo.
    turbopackFileSystemCacheForDev: false,
  },
  partialPrefetching: true,
  // Pôsteres vêm direto do CDN do TMDB, sem passar pelo otimizador.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
