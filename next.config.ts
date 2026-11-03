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
  // Cabeçalhos de segurança em todas as páginas. A política de conteúdo não restringe scripts (o Next
  // e o tema usam scripts embutidos), mas impede o site de ser embutido em outro e bloqueia plugins.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
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
