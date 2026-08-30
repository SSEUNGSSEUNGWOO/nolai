import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** robots.ts와 같은 판단. 색인해도 되는 세 주소만 올린다. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/making`, priority: 0.6 },
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
  ];
}
