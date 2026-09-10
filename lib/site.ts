/**
 * Where this site lives.
 *
 * The canonical origin is written once because four things have to agree on it: the metadata
 * base that resolves every Open Graph and Twitter image, the sitemap, the robots file, and the
 * manifest. When the custom domain arrives, this is the only line that changes.
 *
 * No trailing slash: everything here appends its own path.
 *
 * The generated name this project deployed under read as "syllabus to calendar" wherever a
 * shared link showed its domain, which is not what the thing is called. The old host stays
 * aliased to the same deployment, so every link already in the world keeps working.
 */
export const SITE_URL = 'https://syllabify-app.vercel.app'

/**
 * When the page's content last meaningfully changed, in UTC.
 *
 * Deliberately a constant rather than `new Date()`. A lastModified that moves on every deploy
 * tells a crawler the page changed when only the build did, and search engines learn to ignore
 * the field entirely. Bump this when the copy or the product actually changes.
 */
export const CONTENT_UPDATED = '2026-09-07'

/**
 * Which build is on screen.
 *
 * This exists because a day was lost to the public link being pinned to a day-old preview: every
 * fix looked absent, and there was no way to tell from the page which build you were looking at.
 * Inferring it from behaviour has cost a phone round-trip since. A commit is the best answer when
 * the deploy came from git; a CLI deploy has no commit, so the build time distinguishes it
 * instead. Both are short enough to read out over a message.
 */
export function buildStamp(sha?: string, at: Date = new Date()): string {
  const clean = sha?.trim()
  if (clean) return clean.slice(0, 7)
  return at.toISOString().slice(5, 16).replace('T', ' ')
}
