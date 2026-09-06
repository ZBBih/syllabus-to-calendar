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
const TRIM = /^[\s\-–—:|•*.,]+|[\s\-–—:|•*.,]+$/g
const WEEKDAY = /^(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?\s*/i
const WEEK_PREFIX = /^(week|wk|unit|module|session|class|lecture|day)\s*#?\d+[:.\-–—]?\s*/i

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
    .replace(TRIM, '')
    .trim()
}

let counter = 0
export function newId() {
  counter += 1
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function extractEvents(text: string, term: Term): ExtractedEvent[] {
  const ref = termReferenceDate(term)
  const min = ref.getTime() - 30 * DAY
  const max = ref.getTime() + 180 * DAY
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const found: ExtractedEvent[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(WEEK_PREFIX, '')
    const results = chrono.parse(line, ref, { forwardDate: true })
    if (results.length === 0) continue

    let remainder = line
    for (const r of results) remainder = remainder.replace(r.text, ' ')
    let title = cleanTitle(remainder)

    const r = results[0]
    if (/^\d{4}$/.test(r.text.trim())) continue
    if (!r.start.isCertain('month') || !r.start.isCertain('day')) continue
    const start = r.start.date()
    if (start.getTime() < min || start.getTime() > max) continue

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

    const timed = results.find((x) => x.start.isCertain('hour'))?.start
    const time = timed
      ? `${String(timed.get('hour')).padStart(2, '0')}:${String(timed.get('minute') ?? 0).padStart(2, '0')}`
      : undefined

    found.push({ id: newId(), date: iso(start), time, title, confidence, reason, include: true, origDate: iso(start), origTitle: title })
  }

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
