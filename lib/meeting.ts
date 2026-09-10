import { termReferenceDate, type Term } from './extract'
import type { Meeting, Weekday } from './ics'

const DAY_TOKENS: [RegExp, Weekday][] = [
  [/\b(mondays?|mon)\b/i, 'MO'],
  [/\b(tuesdays?|tues?)\b/i, 'TU'],
  [/\b(wednesdays?|wed)\b/i, 'WE'],
  [/\b(thursdays?|thurs?|thu)\b/i, 'TH'],
  [/\b(fridays?|fri)\b/i, 'FR'],
  [/\b(saturdays?|sat)\b/i, 'SA'],
  [/\b(sundays?|sun)\b/i, 'SU'],
]
const LETTER_CODES: Record<string, Weekday> = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }
const COMPACT = /\b(?:M|T|W|R|F|Th|Tu){2,5}\b/g
// A one-day class is written as one letter — "Class Meeting Days: M" — which is a letter, not
// a day code, until the label in front of it says otherwise. The label is what makes it safe.
const LABELLED_CODE = /\bdays?\s*:?\s*((?:M|T|W|R|F|Th|Tu|Sa|Su)+)\b/i
const CLASS_WORD = /\b(class|lecture|lab|seminar|section|meets?|meeting)\b/i
const TIME_RANGE = /(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:-|–|—|to)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)?/i
// A place word keeps its own name: "Room 12" and "Science Hall 118" are directions a student
// can follow, while the bare "12" or "118" they used to become is not.
const LOCATION_PLACE = /\b((?:[A-Z][\w.-]*\s+){0,2}(?:[Rr]oom|[Rr]m\.?|[Hh]all|[Bb]uilding|[Bb]ldg\.?)\s+[A-Z0-9][\w.-]*)/
// "in Olin 204" points at the room without naming a place word, so the preposition is dropped.
const LOCATION_IN = /\b[Ii]n\s+([A-Z0-9][\w.-]*(?:\s+[A-Z0-9][\w.-]*){0,3})/

function locationIn(s: string) {
  return LOCATION_PLACE.exec(s) ?? LOCATION_IN.exec(s)
}
const WEEKDAY_INDEX: Record<Weekday, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

function to24(raw: string, mer: string | undefined, fallbackPm: boolean): string {
  const [hStr, mStr = '00'] = raw.split(':')
  let h = Number(hStr)
  const m = mer?.toLowerCase().replace(/\./g, '')
  if (m === 'pm' && h < 12) h += 12
  if (m === 'am' && h === 12) h = 0
  if (!m && fallbackPm && h < 8) h += 12
  return `${String(h).padStart(2, '0')}:${mStr.padStart(2, '0')}`
}

function daysFromLine(line: string): Weekday[] {
  const found = new Set<Weekday>()
  for (const [re, d] of DAY_TOKENS) if (re.test(line)) found.add(d)
  if (found.size === 0) {
    for (const code of line.match(COMPACT) ?? []) {
      const tokens = code.match(/Th|Tu|[MTWRF]/g) ?? []
      for (const t of tokens) found.add(t === 'Th' ? 'TH' : t === 'Tu' ? 'TU' : LETTER_CODES[t])
    }
  }
  if (found.size === 0) {
    const labelled = LABELLED_CODE.exec(line)
    for (const t of labelled?.[1].match(/Th|Tu|[MTWRF]/g) ?? []) {
      found.add(t === 'Th' ? 'TH' : t === 'Tu' ? 'TU' : LETTER_CODES[t])
    }
  }
  return (['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as Weekday[]).filter((d) => found.has(d))
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Find a weekly meeting pattern like "MWF 10:00-10:50 Olin 204" or
 * "Tuesdays and Thursdays, 2:00–3:15 pm, Room 12" in the first part of a syllabus.
 */
export function detectMeeting(text: string, term: Term): Meeting | null {
  const head = text.split('\n').slice(0, 40)
  // A syllabus that labels the row ("Class Hours") often puts the days on the next line and the
  // times on the one after, so each line is also tried joined to the one that follows it. The
  // pairs are read in document order, which keeps a header row ahead of anything further down.
  // Office hours are a time a professor is in a room, not a class anyone has to attend, and
  // they are written in exactly the shape this looks for — often as a bare "Mondays 4:45 pm -
  // 5:45 pm" under a heading, so the heading is looked for above the line too. A line that
  // says outright that it is the class outranks a heading further up the page.
  const nearby = (i: number) => head.slice(Math.max(0, i - 3), i + 2).join(' ')
  const candidates = head.flatMap((line, i) => {
    if (/office\s+hours?/i.test(nearby(i)) && !CLASS_WORD.test(line)) return []
    return i + 1 < head.length ? [line, `${line} ${head[i + 1]}`] : [line]
  })
  for (const line of candidates) {
    const time = TIME_RANGE.exec(line)
    if (!time) continue
    const days = daysFromLine(line)
    if (days.length === 0) continue
    const endMer = time[4] ?? time[2]
    const pmish = /pm|p\.m\./i.test(endMer ?? '')
    const start = to24(time[1], time[2] ?? (time[4] && Number(time[1]) <= Number(time[3]) ? time[4] : undefined), pmish)
    const end = to24(time[3], time[4], pmish)
    if (start >= end) continue
    const loc = locationIn(line.slice(time.index + time[0].length)) ?? locationIn(line)
    const ref = termReferenceDate(term)
    const first = new Date(ref)
    while (!days.some((d) => WEEKDAY_INDEX[d] === first.getUTCDay())) first.setUTCDate(first.getUTCDate() + 1)
    const until = new Date(ref)
    until.setUTCDate(until.getUTCDate() + 7 * 16)
    return { days, start, end, location: loc?.[1]?.trim(), firstDate: iso(first), untilDate: iso(until) }
  }
  return null
}

export const DAY_LABEL: Record<Weekday, string> = { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' }
