import { eventUid, meetingUid } from './uid'

export type CalendarEvent = {
  id: string
  date: string // YYYY-MM-DD
  /** Last day of a multi-day event, e.g. a reading week. Undefined for a single day. */
  endDate?: string // YYYY-MM-DD
  time?: string // HH:MM
  title: string
  confidence: 'high' | 'low'
  reason?: string
  include?: boolean
  /** What extraction originally produced, so re-runs can match rows the user has edited. */
  origDate?: string
  origTitle?: string
  /** The syllabus line the event came from, shown as the calendar description. */
  source?: string
  /** Set when a re-run of the syllabus no longer mentions this row. */
  missing?: boolean
  /** The student put this row here themselves, so no re-read of the syllabus may retire it. */
  manual?: boolean
}

/** A weekly class meeting, emitted as one recurring event. */
export type Meeting = {
  days: Weekday[]
  start: string // HH:MM
  end: string // HH:MM
  location?: string
  firstDate: string // YYYY-MM-DD, first occurrence on or after term start
  untilDate: string // YYYY-MM-DD, last day of the term
}
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

export type CourseEvents = { name: string; events: CalendarEvent[]; meeting?: Meeting | null }

/** One line of the previous export, kept so a later export can withdraw what is gone. */
export type ExportedEntry = { uid: string; date: string; summary: string }

export type BuildOptions = {
  /** Bumped on every export. Calendar apps ignore a repeat UID unless SEQUENCE has grown. */
  sequence?: number
  /** Events from an earlier export that are no longer wanted; emitted as cancellations. */
  cancelled?: ExportedEntry[]
}

export type Reminder = '1d' | '2d' | 'morning' | 'none'
export const REMINDERS: { value: Reminder; label: string }[] = [
  { value: '1d', label: '1 day before' },
  { value: '2d', label: '2 days before' },
  { value: 'morning', label: 'Morning of (8am)' },
  { value: 'none', label: 'No reminder' },
]

/**
 * When the alarm fires, as an offset from the event's own start.
 *
 * "Morning of" used to fall back to one hour before on any event that had a time, on the
 * grounds that 8am was unknowable — but the start time is right there, so the offset back to
 * 8am is simple arithmetic. A 2pm exam now warns at 8am as the label promises, rather than at
 * 1pm. An event that begins at or before 8am has no morning left to warn in, so it keeps the
 * hour's notice.
 */
function trigger(r: Reminder, time: string | undefined): string | null {
  switch (r) {
    case '1d':
      return '-P1D'
    case '2d':
      return '-P2D'
    case 'morning': {
      // All-day events start at 00:00, so +8h lands at 8am.
      if (!time) return 'PT8H'
      const [h, m] = time.split(':').map(Number)
      const minutesAfterEight = h * 60 + m - 8 * 60
      if (minutesAfterEight <= 0) return '-PT1H'
      const hh = Math.floor(minutesAfterEight / 60)
      const mm = minutesAfterEight % 60
      return `-PT${hh > 0 ? `${hh}H` : ''}${mm > 0 ? `${mm}M` : ''}`
    }
    case 'none':
      return null
  }
}

export function escapeIcs(s: string): string {
  return (
    s
      // Control characters go before the escaping rather than after it. A property value is
      // written into its line raw, so a stray carriage return or NUL ends the line early and
      // whatever followed it is read by the calendar app as a property of its own.
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n')
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HH_MM = /^\d{2}:\d{2}$/

/**
 * Whether a value is shaped like the date this builder will write into a line.
 *
 * Escaping protects the text fields, but the dates and times are spliced in unescaped — a date
 * only ever has hyphens taken out of it. Restored site data reaches the builder having been
 * checked for being a string and nothing more, so the shape is checked here, at the point the
 * value becomes part of the file.
 */
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return false
  // Round-trip rather than Date.parse, which rolls 2026-02-31 forward to March instead of
  // rejecting it. A date the calendar would silently move is not a date this app wrote.
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export function isHhMm(s: unknown): s is string {
  if (typeof s !== 'string' || !HH_MM.test(s)) return false
  const [h, m] = s.split(':').map(Number)
  return h < 24 && m < 60
}

/** UIDs are hashes this app mints itself; anything else in that field arrived by tampering. */
export function isSafeUid(s: string): boolean {
  return /^[A-Za-z0-9._@-]{1,255}$/.test(s)
}

const WEEKDAYS = new Set<Weekday>(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])

/** A meeting complete and well-formed enough to become a recurring event. */
export function usableMeeting(m: Meeting | null | undefined): m is Meeting {
  if (!m || !Array.isArray(m.days) || m.days.length === 0) return false
  if (!m.days.every((d) => WEEKDAYS.has(d))) return false
  return isIsoDate(m.firstDate) && isIsoDate(m.untilDate) && isHhMm(m.start) && isHhMm(m.end)
}

/** A row complete and well-formed enough to become a calendar entry. */
export function usableEvent(ev: CalendarEvent): boolean {
  return ev.include !== false && isIsoDate(ev.date)
}

/** Fold at 75 octets per RFC 5545 §3.1. */
export function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const dec = new TextDecoder()
  const out: string[] = []
  let start = 0
  let first = true
  while (start < bytes.length) {
    const max = first ? 75 : 74
    let end = Math.min(start + max, bytes.length)
    // don't split a multibyte char
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--
    out.push((first ? '' : ' ') + dec.decode(bytes.subarray(start, end)))
    start = end
    first = false
  }
  return out.join('\r\n')
}

function compact(date: string) {
  return date.replace(/-/g, '')
}

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * An hour after the start, but never past midnight.
 *
 * Syllabi are full of things due at 11:59pm, and an hour-long block from there would spill
 * into the next day, which is where a calendar then draws it. Clamping to the end of the day
 * keeps a deadline on the day it belongs to.
 */
function plusHour(date: string, time: string) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(Date.UTC(2000, 0, 1, h, m))
  d.setUTCHours(d.getUTCHours() + 1)
  if (d.getUTCDate() !== 1) return { date, time: '235959' }
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return { date, time: `${hh}${mm}00` }
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function summaryFor(courseName: string, title: string) {
  return `${courseName}: ${title}`
}

/** Everything the next export needs to know about what this one put on the calendar. */
export function exportedEntries(courses: CourseEvents[]): ExportedEntry[] {
  const out: ExportedEntry[] = []
  for (const course of courses) {
    for (const ev of course.events) {
      if (!usableEvent(ev)) continue
      out.push({ uid: eventUid(course.name, ev), date: ev.date, summary: summaryFor(course.name, ev.title) })
    }
    if (usableMeeting(course.meeting)) {
      out.push({ uid: meetingUid(course.name), date: course.meeting.firstDate, summary: course.name })
    }
  }
  return out
}

export function buildIcs(courses: CourseEvents[], reminder: Reminder = '1d', options: BuildOptions = {}): string {
  const seq = options.sequence ?? 0
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syllabify//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  const now = stamp()
  for (const course of courses) {
    for (const ev of course.events) {
      if (!usableEvent(ev)) continue
      // A malformed time loses only the time: the row still reaches the calendar as an all-day
      // entry, which beats dropping a deadline over a field the student never typed.
      const time = isHhMm(ev.time) ? ev.time : undefined
      const endDate = isIsoDate(ev.endDate) ? ev.endDate : undefined
      const summary = summaryFor(course.name, ev.title)
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${eventUid(course.name, ev)}`)
      lines.push(`DTSTAMP:${now}`)
      lines.push(`LAST-MODIFIED:${now}`)
      lines.push(`SEQUENCE:${seq}`)
      if (time) {
        const end = plusHour(ev.date, time)
        lines.push(`DTSTART:${compact(ev.date)}T${time.replace(':', '')}00`)
        lines.push(`DTEND:${compact(end.date)}T${end.time}`)
      } else {
        lines.push(`DTSTART;VALUE=DATE:${compact(ev.date)}`)
        // An all-day DTEND is exclusive, so a range ends the day after its last day.
        lines.push(`DTEND;VALUE=DATE:${compact(nextDay(endDate ?? ev.date))}`)
      }
      lines.push(`SUMMARY:${escapeIcs(summary)}`)
      if (ev.source && ev.source.trim() !== ev.title.trim()) lines.push(`DESCRIPTION:${escapeIcs(ev.source.trim())}`)
      const trig = trigger(reminder, time)
      if (trig) {
        lines.push('BEGIN:VALARM')
        lines.push('ACTION:DISPLAY')
        lines.push(`DESCRIPTION:${escapeIcs(summary)}`)
        lines.push(`TRIGGER:${trig}`)
        lines.push('END:VALARM')
      }
      lines.push('END:VEVENT')
    }
  }
  for (const course of courses) {
    const m = course.meeting
    if (!usableMeeting(m)) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${meetingUid(course.name)}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`LAST-MODIFIED:${now}`)
    lines.push(`SEQUENCE:${seq}`)
    lines.push(`DTSTART:${compact(m.firstDate)}T${m.start.replace(':', '')}00`)
    lines.push(`DTEND:${compact(m.firstDate)}T${m.end.replace(':', '')}00`)
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${m.days.join(',')};UNTIL=${compact(m.untilDate)}T235959`)
    lines.push(`SUMMARY:${escapeIcs(course.name)}`)
    if (m.location) lines.push(`LOCATION:${escapeIcs(m.location)}`)
    lines.push('END:VEVENT')
  }
  for (const gone of options.cancelled ?? []) {
    if (!isSafeUid(gone.uid) || !isIsoDate(gone.date)) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${gone.uid}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`LAST-MODIFIED:${now}`)
    lines.push(`SEQUENCE:${seq}`)
    lines.push(`DTSTART;VALUE=DATE:${compact(gone.date)}`)
    lines.push(`DTEND;VALUE=DATE:${compact(nextDay(gone.date))}`)
    // "Start over" scrubs the titles out of the export history, so a withdrawal can arrive
    // without one. SUMMARY is optional in a VEVENT, and an absent property sits better with a
    // strict parser than an empty value, so the line is left out entirely.
    if (gone.summary) lines.push(`SUMMARY:${escapeIcs(gone.summary)}`)
    lines.push('STATUS:CANCELLED')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
