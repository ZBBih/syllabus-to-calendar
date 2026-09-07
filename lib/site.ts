/**
 * Where this site lives.
 *
 * The canonical origin is written once because four things have to agree on it: the metadata
 * base that resolves every Open Graph and Twitter image, the sitemap, the robots file, and the
 * manifest. When the custom domain arrives, this is the only line that changes.
 *
 * No trailing slash: everything here appends its own path.
 */
export const SITE_URL = 'https://syllabus-to-calendar-ten.vercel.app'

/**
 * When the page's content last meaningfully changed, in UTC.
 *
 * Deliberately a constant rather than `new Date()`. A lastModified that moves on every deploy
 * tells a crawler the page changed when only the build did, and search engines learn to ignore
 * the field entirely. Bump this when the copy or the product actually changes.
 */
export const CONTENT_UPDATED = '2026-09-07'
