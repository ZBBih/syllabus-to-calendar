import * as chrono from 'chrono-node'
import type { CalendarEvent } from './ics'

export type Season = 'Fall' | 'Spring' | 'Summer' | 'Winter'
export type Term = { season: Season; year: number }
export type ExtractedEvent = CalendarEvent

export const SEASONS: Season[] = ['Fall', 'Spring', 'Summer', 'Winter']

const SEASON_START: Record<Season, [number, number]> = {
  Fall: [7, 15],
  Spring: [0, 5],
  Summer: [4, 15],
  Winter: [11, 15],
}

export function termReferenceDate(term: Term): Date {
  const [m, d] = SEASON_START[term.season]
  return new Date(Date.UTC(term.year, m, d, 12))
}

const DAY = 86_400_000
// Removing the dates from a line leaves whatever joined them behind, so a slash, an ampersand
// and a joining word are trimmed off the ends of the title as well as the usual punctuation.
const TRIM = /^[\s\-–—:|•*.,/&]+|[\s\-–—:|•*.,/&]+$/g
const LEAD_JOIN = /^(and|or|to|through|thru|until|till)\b[\s\-–—:,]*/i
const WEEKDAY = /^(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?\s*/i
const WEEK_PREFIX = /^(week|wk|unit|module|session|class|lecture|day)\s*#?\d+[:.\-–—]?\s*/i

// chrono turns a length of time into a date by counting from the reference date, and marks the
// month and the day certain when it does: "delayed submissions up to 3 days" in a late-work
// policy comes back as the third day of term, indistinguishable from a date someone typed. No
// syllabus schedules anything as a bare duration, so these are refused before they can become a
// row. Letting them through is what put whole policy paragraphs on students' calendars.
// chrono hands back the qualifier along with the span — "within 24 hours", "3 days later" —
// so the parts are assembled rather than written out as one literal.
const DUR_LEAD = '(?:within|in|after|before|up\\s+to|for|over|about|around|at\\s+least|at\\s+most|another|the\\s+next|the\\s+last|next|past|last|every)'
const DUR_COUNT = '(?:\\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|couple(?:\\s+of)?|few|several)'
const DUR_UNIT = '(?:minute|min|hour|hr|day|week|weekend|month|year)s?'
const DUR_TAIL = '(?:later|earlier|ago|from\\s+now|out|prior|in\\s+advance)'
const DURATION = new RegExp(`^(?:${DUR_LEAD}\\s+)?(?:${DUR_COUNT}[\\s-]*)?${DUR_UNIT}(?:\\s+${DUR_TAIL})?$`, 'i')

// A title is what a student reads in a calendar row. Past this length the line is prose that
// happened to carry a date, not a schedule entry, so it is cut to something readable and
// flagged for a look. The untouched line stays on the event as its source.
const TITLE_MAX = 120

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function cleanTitle(s: string) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s*([,;:])\s*(?:[,;:]\s*)+/g, '$1 ')
    .replace(/\s+\b(at|on|by)\s*$/i, '')
    .replace(TRIM, '')
    .replace(WEEKDAY, '')
    .replace(LEAD_JOIN, '')
    .replace(TRIM, '')
    .trim()
}

let counter = 0
export function newId() {
  counter += 1
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * One line of the syllabus as extraction saw it.
 *
 * The question that keeps a student retyping a syllabus by hand is "what did it miss?", and a
 * list of what was found cannot answer it. This carries the skipped dates too, with the reason,
 * so the answer is on the page instead of in the student's imagination.
 */
export type ReadLine = {
  text: string
  captured: { date: string; endDate?: string; time?: string; title: string }[]
  /** `title` is the line with its dates removed, cleaned the same way a captured row's is. */
  skipped: { text: string; date?: string; reason: string; title: string }[]
}

export function extractEvents(text: string, term: Term): ExtractedEvent[] {
  return dedupe(scan(text, term).events)
}

/** What extraction read, line by line, from the same pass that produces the events. */
export function readReport(text: string, term: Term): ReadLine[] {
  return scan(text, term).lines
}

function dedupe(found: ExtractedEvent[]): ExtractedEvent[] {
  const seen = new Set<string>()
  return found
    .filter((e) => {
      const k = `${e.date}|${e.title.toLowerCase()}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
}

function scan(text: string, term: Term): { events: ExtractedEvent[]; lines: ReadLine[] } {
  const ref = termReferenceDate(term)
  const min = ref.getTime() - 30 * DAY
  const max = ref.getTime() + 180 * DAY
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const found: ExtractedEvent[] = []
  const report: ReadLine[] = lines.map((text) => ({ text, captured: [], skipped: [] }))

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(WEEK_PREFIX, '')
    const results = chrono.parse(line, ref, { forwardDate: true })
    if (results.length === 0) continue

    let remainder = line
    for (const r of results) remainder = remainder.replace(r.text, ' ')
    let title = cleanTitle(remainder)

    // A schedule row often carries more than one date ("Sept 9 / Sept 11  Reading response 1
    // due"), and taking only the first loses the rest. Each date certain to a month and a day,
    // and inside the term, becomes its own row; the dedupe below folds a date the line repeats.
    const dated = results.filter(
      (r) =>
        !/^\d{4}$/.test(r.text.trim()) && !DURATION.test(r.text.trim()) && r.start.isCertain('month') && r.start.isCertain('day'),
    )
    const inTerm = dated.filter((r) => {
      const t = r.start.date().getTime()
      return t >= min && t <= max
    })

    // Everything the line offered and extraction turned down, with the reason, for the report.
    for (const r of results) {
      if (inTerm.includes(r)) continue
      // A bare year is not a deadline anyone lost, and neither is the time on a line whose date
      // was captured; reporting either as missed would be noise in the one place that has to be
      // trustworthy.
      if (/^\d{4}$/.test(r.text.trim())) continue
      if (DURATION.test(r.text.trim())) {
        report[i].skipped.push({ text: r.text, reason: 'a length of time, not a date', title })
      } else if (!r.start.isCertain('month') || !r.start.isCertain('day')) {
        // A bare time is part of the line's date, not a date the report should claim was lost.
        if (!r.start.isCertain('hour')) report[i].skipped.push({ text: r.text, reason: 'no month and day', title })
      } else {
        report[i].skipped.push({ text: r.text, date: iso(r.start.date()), reason: 'outside the term', title })
      }
    }

    if (inTerm.length === 0) continue

    let confidence: 'high' | 'low' = 'high'
    let reason: string | undefined
    if (!title && i + 1 < lines.length && chrono.parse(lines[i + 1], ref).length === 0) {
      title = cleanTitle(lines[i + 1])
      confidence = 'low'
      reason = 'date only'
      i += 1
    }
    if (title.length < 3) {
      confidence = 'low'
      reason = reason ?? 'no title found'
    }
    if (title.length > TITLE_MAX) {
      title = title.slice(0, TITLE_MAX).replace(/\s+\S*$/, '') + '…'
      confidence = 'low'
      reason = reason ?? 'the line reads as a paragraph, not a schedule row'
    }

    // A time written once on the line belongs to the date on that line, but only when there is
    // a single date to give it to: "Sept 9 / Sept 11, both due 5pm" is the rare shape, and
    // guessing wrong there puts a deadline at the wrong hour.
    const lineTime = inTerm.length === 1 ? results.find((x) => x.start.isCertain('hour'))?.start : undefined
    const source = lines[i - (reason === 'date only' ? 1 : 0)]

    for (const r of inTerm) {
      const start = r.start.date()
      const timed = r.start.isCertain('hour') ? r.start : lineTime
      const time = timed
        ? `${String(timed.get('hour')).padStart(2, '0')}:${String(timed.get('minute') ?? 0).padStart(2, '0')}`
        : undefined

      // "Oct 20-21 Fall break" is one event across both days, not one event on the twentieth.
      const last = r.end && r.end.isCertain('month') && r.end.isCertain('day') ? r.end.date() : null
      const endDate = last && iso(last) > iso(start) ? iso(last) : undefined

      found.push({ id: newId(), date: iso(start), endDate, time, title, confidence, reason, include: true, origDate: iso(start), origTitle: title, source })
      // A date-only line borrows the next line's title, so the capture belongs to the line the
      // date was on, which is where the student will look for it.
      report[i - (reason === 'date only' ? 1 : 0)].captured.push({ date: iso(start), endDate, time, title })
    }
  }

  return { events: found, lines: report }
}
