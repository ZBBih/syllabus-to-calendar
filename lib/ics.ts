export type CalendarEvent = {
  id: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  title: string
  confidence: 'high' | 'low'
  reason?: string
  include?: boolean
  /** What extraction originally produced, so re-runs can match rows the user has edited. */
  origDate?: string
  origTitle?: string
}

export type CourseEvents = { name: string; events: CalendarEvent[] }

export type Reminder = '1d' | '2d' | 'morning' | 'none'
export const REMINDERS: { value: Reminder; label: string }[] = [
  { value: '1d', label: '1 day before' },
  { value: '2d', label: '2 days before' },
  { value: 'morning', label: 'Morning of (8am)' },
  { value: 'none', label: 'No reminder' },
]

function trigger(r: Reminder, allDay: boolean): string | null {
  switch (r) {
    case '1d':
      return '-P1D'
    case '2d':
      return '-P2D'
    case 'morning':
      // All-day events start at 00:00, so +8h lands at 8am. Timed events: 8am same day relative to start is unknowable, use -PT0M... fall back to 1 hour before.
      return allDay ? 'PT8H' : '-PT1H'
    case 'none':
      return null
  }
}

export function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
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

function plusHour(date: string, time: string) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(Date.UTC(2000, 0, 1, h, m))
  d.setUTCHours(d.getUTCHours() + 1)
  const dayRoll = d.getUTCDate() !== 1
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return { date: dayRoll ? nextDay(date) : date, time: `${hh}${mm}00` }
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildIcs(courses: CourseEvents[], reminder: Reminder = '1d'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//syllabus-to-calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  const now = stamp()
  for (const course of courses) {
    for (const ev of course.events) {
      if (ev.include === false) continue
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${ev.id}@syllabus-to-calendar`)
      lines.push(`DTSTAMP:${now}`)
      if (ev.time) {
        const end = plusHour(ev.date, ev.time)
        lines.push(`DTSTART:${compact(ev.date)}T${ev.time.replace(':', '')}00`)
        lines.push(`DTEND:${compact(end.date)}T${end.time}`)
      } else {
        lines.push(`DTSTART;VALUE=DATE:${compact(ev.date)}`)
        lines.push(`DTEND;VALUE=DATE:${compact(nextDay(ev.date))}`)
      }
      lines.push(`SUMMARY:${escapeIcs(`${course.name}: ${ev.title}`)}`)
      const trig = trigger(reminder, !ev.time)
      if (trig) {
        lines.push('BEGIN:VALARM')
        lines.push('ACTION:DISPLAY')
        lines.push(`DESCRIPTION:${escapeIcs(`${course.name}: ${ev.title}`)}`)
        lines.push(`TRIGGER:${trig}`)
        lines.push('END:VALARM')
      }
      lines.push('END:VEVENT')
    }
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
