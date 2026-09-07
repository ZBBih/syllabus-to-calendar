import type { MetadataRoute } from 'next'
import { CONTENT_UPDATED, SITE_URL } from '@/lib/site'

/**
 * Every address worth crawling.
 *
 * There is exactly one, and that is not an oversight. Syllabify is a single page: the upload,
 * review and export steps are state inside it, not routes, so there is no second URL a person
 * could land on or link to. Padding this with the icon, manifest and Open Graph endpoints would
 * list files that are already discovered from the page's own head, and a sitemap full of assets
 * is a well-known way to dilute the one entry that matters.
 *
 * If a route ever does appear — a guide, a changelog, a per-school page — it belongs here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(`${CONTENT_UPDATED}T00:00:00Z`),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
