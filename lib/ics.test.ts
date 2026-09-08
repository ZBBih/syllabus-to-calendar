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
    expect(out).toMatch(/UID:[0-9a-f]{16}@syllabify\.app/)
  })

  it('spans a multi-day event to the day after its last day', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-10-20', endDate: '2026-10-21', title: 'Fall break' }] }])
    expect(out).toContain('DTSTART;VALUE=DATE:20261020')
    expect(out).toContain('DTEND;VALUE=DATE:20261022')
  })

  it('serialises a timed event as one hour floating', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '14:00', title: 'Final' }] }])
    expect(out).toContain('DTSTART:20260914T140000')
    expect(out).toContain('DTEND:20260914T150000')
  })

  it('keeps a late-night deadline on its own day', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '23:59', title: 'Essay' }] }])
    expect(out).toContain('DTSTART:20260914T235900')
    expect(out).toContain('DTEND:20260914T235959')
  })

  it('fires "morning of" at 8am on the day, whatever time the event starts', () => {
    const two = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '14:00', title: 'Exam' }] }], 'morning')
    expect(two).toContain('TRIGGER:-PT6H')
    const half = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '09:30', title: 'Quiz' }] }], 'morning')
    expect(half).toContain('TRIGGER:-PT1H30M')
    const late = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '23:59', title: 'Paper' }] }], 'morning')
    expect(late).toContain('TRIGGER:-PT15H59M')
    // An all-day event starts at midnight, so the alarm counts forward to 8am.
    const allDay = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', title: 'Reading' }] }], 'morning')
    expect(allDay).toContain('TRIGGER:PT8H')
    // Before 8am there is no morning left, so the hour's notice stands.
    const early = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', time: '07:00', title: 'Lab' }] }], 'morning')
    expect(early).toContain('TRIGGER:-PT1H')
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

/**
 * The .ics file is the one thing this app hands to a system outside itself, so a value that
 * escapes its own line is the only injection this app can actually suffer. Nothing in the UI
 * types a carriage return into a date field, but tampered site data and any future import path
 * both reach the builder, and the file the student then feeds to Google Calendar is not the
 * place to find out.
 */
describe('injection through the calendar file', () => {
  it('strips a bare carriage return from a summary', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '2026-09-14', title: 'Exam\rSUMMARY:Cancelled' }] }])
    expect(out).not.toMatch(/\rSUMMARY:Cancelled/)
    expect(out.split('\r\n').filter((l) => l.startsWith('SUMMARY:'))).toHaveLength(1)
  })

  it('strips control characters from a description', () => {
    const out = buildIcs([
      { name: 'X', events: [{ ...base, date: '2026-09-14', title: 'Essay', source: 'due\x01soon ' }] },
    ])
    expect(out).toContain('DESCRIPTION:duesoon')
  })

  it('drops an event whose date is not a real date', () => {
    const out = buildIcs([{ name: 'X', events: [{ ...base, date: '20260914\r\nSUMMARY:Injected', title: 'Exam' }] }])
    expect(out).not.toContain('SUMMARY:Injected')
    expect(out).not.toContain('BEGIN:VEVENT')
  })

  it('drops a time that is not a real time rather than emitting it', () => {
    const out = buildIcs([
      { name: 'X', events: [{ ...base, date: '2026-09-14', time: '14:00\r\nX-EVIL:1', title: 'Exam' }] },
    ])
    expect(out).not.toContain('X-EVIL')
    // Falls back to the all-day form, so the deadline still reaches the calendar.
    expect(out).toContain('DTSTART;VALUE=DATE:20260914')
  })

  it('ignores an end date that is not a real date', () => {
    const out = buildIcs([
      { name: 'X', events: [{ ...base, date: '2026-10-20', endDate: 'x\r\nX-EVIL:1', title: 'Break' }] },
    ])
    expect(out).not.toContain('X-EVIL')
    expect(out).toContain('DTEND;VALUE=DATE:20261021')
  })

  it('drops a weekly meeting with a malformed time', () => {
    const out = buildIcs([
      {
        name: 'X',
        events: [],
        meeting: { days: ['MO'], start: '09:00\r\nX-EVIL:1', end: '10:00', firstDate: '2026-09-14', untilDate: '2026-12-10' },
      },
    ])
    expect(out).not.toContain('X-EVIL')
    expect(out).not.toContain('BEGIN:VEVENT')
  })

  it('drops a cancellation with a malformed date', () => {
    const out = buildIcs([], '1d', {
      cancelled: [{ uid: 'u@syllabify.app', date: '2026\r\nX-EVIL:1', summary: 'Gone' }],
    })
    expect(out).not.toContain('X-EVIL')
    expect(out).not.toContain('BEGIN:VEVENT')
  })

  it('still cancels a well-formed withdrawal', () => {
    const out = buildIcs([], '1d', { cancelled: [{ uid: 'u@syllabify.app', date: '2026-09-14', summary: 'Gone' }] })
    expect(out).toContain('STATUS:CANCELLED')
  })
})

/**
 * A withdrawal whose title has been scrubbed by "Start over" still has to reach the calendar.
 * RFC 5545 makes SUMMARY optional in a VEVENT, and an empty property value is likelier to trip
 * a strict parser than an absent property, so the line is left out rather than emitted blank.
 */
describe('a cancellation with no title', () => {
  const gone = { uid: 'a1@syllabify.app', date: '2026-12-09', summary: '' }

  it('still withdraws the event', () => {
    const out = buildIcs([], '1d', { cancelled: [gone] })
    expect(out).toContain('UID:a1@syllabify.app')
    expect(out).toContain('STATUS:CANCELLED')
    expect(out).toContain('DTSTART;VALUE=DATE:20261209')
  })

  it('omits the summary line rather than emitting an empty one', () => {
    const out = buildIcs([], '1d', { cancelled: [gone] })
    expect(out).not.toContain('SUMMARY:')
  })

  it('still writes a summary when there is one', () => {
    const out = buildIcs([], '1d', { cancelled: [{ ...gone, summary: 'ECON 101: Midterm' }] })
    expect(out).toContain('SUMMARY:ECON 101: Midterm')
  })
})
