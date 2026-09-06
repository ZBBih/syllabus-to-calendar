import { describe, it, expect } from 'vitest'
import { SAMPLE_NAME, SAMPLE_TEXT } from './sample'
import { extractEvents } from './extract'
import { extractWeights, gradeSummary } from './grades'
import { detectMeeting } from './meeting'

const term = { season: 'Fall', year: 2026 } as const

/** The sample is the first thing many visitors click, so it has to exercise the whole app. */
describe('the built-in sample', () => {
  it('yields a full schedule of dates', () => {
    expect(extractEvents(SAMPLE_TEXT, term).length).toBeGreaterThanOrEqual(10)
  })

  it('yields a weekly class meeting', () => {
    const m = detectMeeting(SAMPLE_TEXT, term)
    expect(m).toMatchObject({ days: ['MO', 'WE', 'FR'], start: '10:00', end: '10:50' })
  })

  it('yields a grading table that totals 100', () => {
    const w = extractWeights(SAMPLE_TEXT)
    expect(w.map((r) => r.label)).toEqual(['Reading responses', 'Quizzes', 'Midterm exam', 'Group presentation', 'Final paper'])
    expect(gradeSummary(w).total).toBe(100)
  })

  it('has a name', () => {
    expect(SAMPLE_NAME).toBe('PSYC 101')
  })
})
