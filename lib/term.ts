import type { Season, Term } from './extract'

/**
 * The term a syllabus names, read from its own text.
 *
 * Without this the term comes from today's date, and every date outside a window around that
 * guess is dropped silently: a student loading next spring's syllabi in November sees no dates
 * at all and nothing to act on. A syllabus almost always names its term in the first few lines,
 * so reading it there is more reliable than guessing from the calendar.
 */

const SEASON_OF: Record<string, Season> = {
  fall: 'Fall',
  autumn: 'Fall',
  spring: 'Spring',
  summer: 'Summer',
  winter: 'Winter',
}

// A two-digit year only counts with an apostrophe in front of it: "Fall 26" is far more often
// a course number, a room, or a count than it is a year.
const TERM = /\b(fall|autumn|spring|summer|winter)\b[\s,]*(?:of\s+)?(?:'(\d{2})|((?:19|20)\d{2}))\b/i

/** How far into the document to look. Later mentions are usually next term's registration dates. */
const HEAD_LINES = 40

export function termFromText(text: string): Term | null {
  const head = text.split('\n').slice(0, HEAD_LINES).join('\n')
  const m = TERM.exec(head)
  if (!m) return null
  const season = SEASON_OF[m[1].toLowerCase()]
  const year = m[2] ? 2000 + Number(m[2]) : Number(m[3])
  return { season, year }
}
