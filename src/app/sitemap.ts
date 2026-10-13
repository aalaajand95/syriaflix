import type { MetadataRoute } from "next";
import { getShows } from "@/lib/catalog";
import { LOCALES } from "@/lib/types";

export const dynamic = "force-static";

// NEXT_PUBLIC_SITE_URL wins (custom domain); otherwise Railway's generated domain.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000")
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "browse/", ...getShows().map((s) => `shows/${s.slug}/`)];
  return paths.flatMap((p) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}/${p}`,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/${p}`])) },
    })),
  );
}
