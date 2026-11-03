import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/share";

// O Google pode ler tudo que é público; telas da conta e a API ficam de fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/settings", "/notifications", "/import", "/moderation", "/reset-password", "/auth/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
