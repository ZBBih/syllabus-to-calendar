import type { ExtractedEvent } from './extract'

function key(e: ExtractedEvent) {
  const d = e.origDate ?? e.date
  const t = (e.origTitle ?? e.title).toLowerCase()
  return `${d}|${t}`
}

/**
 * Merge freshly extracted events into the existing review rows.
 * Rows whose original date+title match keep the user's edits and checkbox.
 * New results are appended. Nothing is ever removed.
 */
export function mergeEvents(existing: ExtractedEvent[], fresh: ExtractedEvent[]): ExtractedEvent[] {
  const seen = new Set(existing.map(key))
  const added = fresh.filter((f) => {
    const k = key(f)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return [...existing, ...added].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''),
  )
}
