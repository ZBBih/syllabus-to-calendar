import * as chrono from 'chrono-node'
import { looksLikeCode } from './course-name'
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
const DUR_LEAD = '(?:within|in|after|before|up\\s+to|for|over|about|around|at\\s+least|at\\s+most|another|the\\s+next|the\\s+last|next|past|last|every|the|this|that|each)'
const DUR_COUNT = '(?:\\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|couple(?:\\s+of)?|few|several)'
const DUR_UNIT = '(?:minute|min|hour|hr|day|week|weekend|month|year)s?'
const DUR_TAIL = '(?:later|earlier|ago|from\\s+now|out|prior|in\\s+advance)'
const DURATION = new RegExp(`^(?:${DUR_LEAD}\\s+)?(?:${DUR_COUNT}[\\s-]*)?${DUR_UNIT}(?:\\s+${DUR_TAIL})?$`, 'i')

// The other half of the same trap. chrono resolves "now" against the reference date and marks
// the result certain in month and day, so the word inside a sentence — "we now create as much
// data as..." — arrives indistinguishable from a date someone typed, on the first day of term.
const CASUAL = /^(?:now|today|tonight|tomorrow|yesterday)$/i

// A date does not sit inside an equation. "your final score remains 400 × 10/10 = 400" reads
// as the tenth of October otherwise, which is a real row on a real syllabus.
const ARITHMETIC = /[×*=]\s*$/

/** Whether a span chrono matched is something other than a date, and must not become a row. */
function notADate(r: { text: string; index: number }, line: string): boolean {
  const text = r.text.trim()
  if (/^\d{4}$/.test(text)) return true
  if (DURATION.test(text) || CASUAL.test(text)) return true
  const before = line.slice(0, r.index)
  const after = line.slice(r.index + r.text.length)
  return ARITHMETIC.test(before) || /^\s*[×*=]/.test(after)
}

// A time is written as a clock: it has a colon or it says am or pm. Without that rule "groups
// of 4–6 students" starts a deadline at four in the morning and "Lecture 12-1" starts a class
// at noon, both of which happened on a real syllabus.
const CLOCK = /\d\s*(?::\s*\d|[ap]\.?m\.?)/i

// A date at the front of a line is a schedule row. A date with a sentence on both sides of it
// is prose that mentions a deadline, and past this length that is what the line is. The date
// is real, so the row is still offered — it just arrives unticked rather than pre-approved.
const SENTENCE_MIN = 80

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
  // The events are deduped on their way out, so the report has to fold the same copies or it
  // tells the student it captured one more date than the table below it is showing.
  const seen = new Set<string>()
  return scan(text, term).lines.map((l) => ({
    ...l,
    captured: l.captured.filter((c) => {
      const k = dedupeKey(c)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    }),
  }))
}

const dedupeKey = (e: { date: string; title: string }) => `${e.date}|${e.title.toLowerCase()}`

function dedupe(found: ExtractedEvent[]): ExtractedEvent[] {
  const seen = new Set<string>()
  return found
    .filter((e) => {
      const k = dedupeKey(e)
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

    // A schedule row often carries more than one date ("Sept 9 / Sept 11  Reading response 1
    // due"), and taking only the first loses the rest. Each date certain to a month and a day,
    // and inside the term, becomes its own row; the dedupe below folds a date the line repeats.
    const dated = results.filter((r) => !notADate(r, line) && r.start.isCertain('month') && r.start.isCertain('day'))
    const inTerm = dated.filter((r) => {
      const t = r.start.date().getTime()
      return t >= min && t <= max
    })

    // What comes out of the title is everything the parser read as a date or a clock, whether
    // or not the row could use it: half of a range, or a date outside the term, is noise in a
    // calendar entry. What stays is what was refused for not being a date at all — a lecture
    // numbered 12-1, a group of 4–6 students, "the end of the day" — because those are words
    // in the sentence, and cutting them left holes like "Due by the end of on".
    const strip = results.filter((r) => {
      if (notADate(r, line)) return false
      if (r.start.isCertain('month') && r.start.isCertain('day')) return true
      return !r.start.isCertain('hour') || CLOCK.test(r.text)
    })
    let remainder = line
    for (const r of strip) remainder = remainder.replace(r.text, ' ')
    let title = cleanTitle(remainder)

    // Everything the line offered and extraction turned down, with the reason, for the report.
    for (const r of results) {
      if (inTerm.includes(r)) continue
      // A bare year is not a deadline anyone lost, and neither is the time on a line whose date
      // was captured; reporting either as missed would be noise in the one place that has to be
      // trustworthy.
      if (/^\d{4}$/.test(r.text.trim())) continue
      // "MAR3613" parses as a March date, and naming a course code as a date the app left out
      // is noise in the one screen whose whole job is to be believed.
      if (looksLikeCode(r.text.trim())) continue
      if (notADate(r, line)) {
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
    // A schedule table whose Notes column holds a page of boilerplate arrives as one line once
    // the PDF is flattened: a real date cell, then prose. The date is worth keeping and the
    // title is not, and there is no way to tell from the text which half the student wants —
    // so the row is offered rather than taken. It stays visible and one tap from included.
    let prose = false
    // A sentence long enough to be prose, with the date buried inside it rather than leading
    // it. On the syllabus that prompted this, twenty-two such rows arrived ticked and none
    // were flagged, which is a paragraph of the document landing on a student's calendar.
    const first = inTerm[0]
    const buried = line.slice(0, first.index).trim() !== '' && line.slice(first.index + first.text.length).trim() !== ''
    if (line.length >= SENTENCE_MIN && buried) {
      confidence = 'low'
      reason = reason ?? 'the date sits inside a sentence, not a schedule row'
      prose = true
    }
    if (title.length > TITLE_MAX) {
      title = title.slice(0, TITLE_MAX).replace(/\s+\S*$/, '') + '…'
      confidence = 'low'
      reason = reason ?? 'the line reads as a paragraph, not a schedule row'
      prose = true
    }

    // A time written once on the line belongs to the date on that line, but only when there is
    // a single date to give it to: "Sept 9 / Sept 11, both due 5pm" is the rare shape, and
    // guessing wrong there puts a deadline at the wrong hour.
    const lineTime = inTerm.length === 1 ? results.find((x) => x.start.isCertain('hour') && CLOCK.test(x.text))?.start : undefined
    const source = lines[i - (reason === 'date only' ? 1 : 0)]

    for (const r of inTerm) {
      const start = r.start.date()
      const timed = r.start.isCertain('hour') && CLOCK.test(r.text) ? r.start : lineTime
      const time = timed
        ? `${String(timed.get('hour')).padStart(2, '0')}:${String(timed.get('minute') ?? 0).padStart(2, '0')}`
        : undefined

      // "Oct 20-21 Fall break" is one event across both days, not one event on the twentieth.
      const last = r.end && r.end.isCertain('month') && r.end.isCertain('day') ? r.end.date() : null
      const endDate = last && iso(last) > iso(start) ? iso(last) : undefined

      found.push({ id: newId(), date: iso(start), endDate, time, title, confidence, reason, include: !prose, origDate: iso(start), origTitle: title, source })
      // A date-only line borrows the next line's title, so the capture belongs to the line the
      // date was on, which is where the student will look for it.
      report[i - (reason === 'date only' ? 1 : 0)].captured.push({ date: iso(start), endDate, time, title })
    }
  }

  return { events: found, lines: report }
}
