import { describe, it, expect } from 'vitest'
import { eventUid, meetingUid } from './uid'

const ev = (o: Partial<{ date: string; title: string; origDate: string; origTitle: string }> = {}) => ({
  date: '2026-09-14',
  title: 'Midterm',
  ...o,
})

describe('eventUid', () => {
  it('is the same for the same class and the same extracted event', () => {
    expect(eventUid('ECON 101', ev())).toBe(eventUid('ECON 101', ev()))
  })

  it('ignores case and spacing in the class name so a retyped name still matches', () => {
    expect(eventUid('econ  101', ev())).toBe(eventUid('ECON 101', ev()))
  })

  it('survives the user renaming or re-dating the row, which is what makes an export an update', () => {
    const original = eventUid('ECON 101', ev({ origDate: '2026-09-14', origTitle: 'Midterm' }))
    const edited = eventUid('ECON 101', ev({ date: '2026-09-21', title: 'Midterm (ch 1-5)', origDate: '2026-09-14', origTitle: 'Midterm' }))
    expect(edited).toBe(original)
  })

  it('separates two classes that share a deadline name', () => {
    expect(eventUid('ECON 101', ev())).not.toBe(eventUid('PSYC 101', ev()))
  })

  it('separates two deadlines in one class', () => {
    expect(eventUid('ECON 101', ev({ title: 'Quiz 1' }))).not.toBe(eventUid('ECON 101', ev({ title: 'Quiz 2' })))
  })

  it('is a valid iCalendar identifier', () => {
    expect(eventUid('ECON 101', ev())).toMatch(/^[0-9a-f]{16}@syllabify\.app$/)
  })
})

describe('meetingUid', () => {
  it('is stable per class and distinct from that class\'s events', () => {
    expect(meetingUid('ECON 101')).toBe(meetingUid('econ 101'))
    expect(meetingUid('ECON 101')).not.toBe(eventUid('ECON 101', ev()))
  })
})
