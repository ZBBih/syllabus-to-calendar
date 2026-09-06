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
    expect(out).toContain('UID:e1@syllabify.app')
  })

  it('serialises a timed event as one hour floating', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '14:00', title: 'Final' }] }])
    expect(out).toContain('DTSTART:20260914T140000')
    expect(out).toContain('DTEND:20260914T150000')
  })

  it('escapes and folds and uses CRLF', () => {
    const long = 'A'.repeat(120)
    const out = buildIcs([{ name: 'ECON 101', events: [{ ...base, date: '2026-09-14', title: `Midterm, part 1; ${long}` }] }])
    expect(out).toContain('SUMMARY:ECON 101: Midterm\\, part 1\\; ')
    for (const line of out.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(out.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})

describe('reminders', () => {
  const ev = { ...base, date: '2026-09-14', title: 'X' }
  it('2 days before', () => expect(buildIcs([{ name: 'A', events: [ev] }], '2d')).toContain('TRIGGER:-P2D'))
  it('morning of an all-day event is +8h', () => expect(buildIcs([{ name: 'A', events: [ev] }], 'morning')).toContain('TRIGGER:PT8H'))
  it('none omits the alarm', () => expect(buildIcs([{ name: 'A', events: [ev] }], 'none')).not.toContain('VALARM'))
})

describe('helpers', () => {
  it('escapeIcs escapes backslash, semicolon, comma, newline', () => {
    expect(escapeIcs('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
    expect(escapeIcs('Room 204; bring laptop')).toBe('Room 204\\; bring laptop')
  })
  it('writes a DESCRIPTION from the source line when it adds information', () => {
    const out = buildIcs([{ name: 'A', events: [{ ...base, date: '2026-09-14', title: 'Quiz', source: 'Sept 14: Quiz; bring a pencil' }] }])
    expect(out).toContain('DESCRIPTION:Sept 14: Quiz\\; bring a pencil')
    const same = buildIcs([{ name: 'A', events: [{ ...base, date: '2026-09-14', title: 'Quiz', source: 'Quiz' }] }])
    expect(same).not.toContain('DESCRIPTION:Quiz')
  })
  it('emits a weekly recurring meeting with location', () => {
    const out = buildIcs([
      {
        name: 'ECON 101',
        events: [],
        meeting: { days: ['MO', 'WE', 'FR'], start: '10:00', end: '10:50', location: 'Olin 204', firstDate: '2026-08-17', untilDate: '2026-12-11' },
      },
    ])
    expect(out).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261211T235959')
    expect(out).toContain('DTSTART:20260817T100000')
    expect(out).toContain('LOCATION:Olin 204')
    expect(out).toContain('SUMMARY:ECON 101')
  })
  it('foldLine keeps short lines', () => expect(foldLine('short')).toBe('short'))
})
