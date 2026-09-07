import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Crawling rules.
 *
 * Everything here is public and there is no server, no account area and no user content, so
 * there is nothing to hide from a crawler and no allow-list worth maintaining.
 *
 * Two things are deliberate:
 *
 * `/_next/` is NOT blocked. It is a common reflex to disallow it, and it is a mistake: the page
 * is a React app, so a crawler that cannot fetch the JS and CSS renders a blank document and
 * indexes nothing. Google has asked for those files to stay reachable since 2015.
 *
 * The assistant crawlers are named and allowed on purpose. A student asking a chatbot how to get
 * a syllabus into their calendar is now a real way this gets found, and being absent from that
 * answer costs more than the crawl does. They are listed separately from `*` so that revoking
 * one later is a single edit rather than a rewrite.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
