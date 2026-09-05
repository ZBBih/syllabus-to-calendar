import { describe, it, expect } from 'vitest'
import { buildIcs, escapeIcs, foldLine } from './ics'

const base = { id: 'e1', confidence: 'high' as const }

describe('buildIcs', () => {
  it('serialises an all-day event', () => {
    const out = buildIcs([{ name: 'ECON 101', events: [{ ...base, date: '2026-09-14', title: 'Midterm' }] }])
    expect(out).toContain('DTSTART;VALUE=DATE:20260914')
    expect(out).toContain('DTEND;VALUE=DATE:20260915')
    expect(out).toContain('SUMMARY:ECON 101: Midterm')
    expect(out).toContain('TRIGGER:-P1D')
    expect(out).toContain('UID:e1@syllabus-to-calendar')
  })

  it('serialises a timed event as one hour floating', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '14:00', title: 'Final' }] }])
    expect(out).toContain('DTSTART:20260914T140000')
    expect(out).toContain('DTEND:20260914T150000')
  })

  it('escapes and folds and uses CRLF', () => {
    const long = 'A'.repeat(120)
    const out = buildIcs([{ name: 'ECON 101', events: [{ ...base, date: '2026-09-14', title: `Midterm, part 1; ${long}` }] }])
    expect(out).toContain('SUMMARY:ECON 101: Midterm\\, part 1\; ')
    for (const line of out.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(out.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})

describe('helpers', () => {
  it('escapeIcs', () => expect(escapeIcs('a,b;c\\d\ne')).toBe('a\\,b\;c\\\\d\\ne'))
  it('foldLine keeps short lines', () => expect(foldLine('short')).toBe('short'))
})
