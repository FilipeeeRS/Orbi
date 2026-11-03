import type { Metadata } from "next";

// Endereço do site nas prévias de link: na Vercel, o domínio de produção; aqui, o servidor local.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

// Prévia ao mandar o link no WhatsApp, Discord, X...: título, um resumo curto e a imagem (pôster, capa
// ou foto). O "· Orbi" do título vem do modelo do layout.
export function shareMeta({ title, description, image }: { title?: string; description?: string | null; image?: string | null }): Metadata {
  const text = description?.replace(/\s+/g, " ").trim().slice(0, 200) || undefined;
  const images = image ? [{ url: image }] : undefined;
  return {
    title,
    description: text,
    openGraph: { title, description: text, images, siteName: "Orbi", type: "website" },
    twitter: { card: images ? "summary_large_image" : "summary", title, description: text, images: image ? [image] : undefined },
  };
}
