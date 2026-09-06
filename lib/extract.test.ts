import { describe, it, expect } from 'vitest'
import { extractEvents, termReferenceDate, type Term } from './extract'

const fall: Term = { season: 'Fall', year: 2026 }
const spring: Term = { season: 'Spring', year: 2027 }

describe('termReferenceDate', () => {
  it('fall starts mid August', () => {
    expect(termReferenceDate(fall).toISOString().slice(0, 10)).toBe('2026-08-15')
  })
})

describe('extractEvents', () => {
  it('bulleted line', () => {
    const [e] = extractEvents('- Sept 14: Midterm 1', fall)
    expect(e).toMatchObject({ date: '2026-09-14', title: 'Midterm 1', confidence: 'high' })
    expect(e.time).toBeUndefined()
  })

  it('tab separated with weekday', () => {
    const [e] = extractEvents('Mon Oct 5\tQuiz 2\tCh 4', fall)
    expect(e).toMatchObject({ date: '2026-10-05', title: 'Quiz 2 Ch 4' })
  })

  it('prose with a time', () => {
    const [e] = extractEvents('The final exam will be held on December 12 at 2pm in Room 4.', fall)
    expect(e).toMatchObject({ date: '2026-12-12', time: '14:00', confidence: 'high' })
  })

  it('picks up a time that chrono parses separately', () => {
    const [e] = extractEvents('Oct 12: Midterm exam at 2pm', fall)
    expect(e).toMatchObject({ date: '2026-10-12', time: '14:00', title: 'Midterm exam' })
  })

  it('date-only line takes next line as title', () => {
    const [e] = extractEvents('Nov 3\nEssay due', fall)
    expect(e).toMatchObject({ date: '2026-11-03', title: 'Essay due', confidence: 'low', reason: 'date only' })
  })

  it('spring term resolves into the spring year', () => {
    const [e] = extractEvents('Feb 2 – Problem set 1', spring)
    expect(e).toMatchObject({ date: '2027-02-02', title: 'Problem set 1' })
  })

  it('ignores phone numbers and bare years', () => {
    expect(extractEvents('Call 555-1234\nUpdated 2026\nOffice: Room 12', fall)).toEqual([])
  })

  it('dedupes and sorts', () => {
    const out = extractEvents('Oct 9: Quiz\nSept 1: Intro\nOct 9: Quiz', fall)
    expect(out.map((e) => e.date)).toEqual(['2026-09-01', '2026-10-09'])
  })

  it('date range emits one event on the start date', () => {
    const [e, ...rest] = extractEvents('Sept 14-16: Field trip', fall)
    expect(e.date).toBe('2026-09-14')
    expect(rest).toEqual([])
  })
})
