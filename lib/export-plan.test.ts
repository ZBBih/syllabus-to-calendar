import { describe, it, expect } from 'vitest'
import { planForAll, planForCourse, withdrawn, mergeHistory } from './export'
import { eventUid } from './uid'
import type { Course, State } from './store'
import type { ExtractedEvent } from './extract'

const ev = (o: Partial<ExtractedEvent>): ExtractedEvent => ({
  id: o.id ?? 'e',
  date: '2026-09-14',
  title: 'Midterm',
  confidence: 'high',
  include: true,
  ...o,
})

const course = (name: string, events: ExtractedEvent[]): Course => ({
  id: name,
  name,
  term: { season: 'Fall', year: 2026 },
  text: '',
  events,
  extracted: true,
  meeting: null,
  meetingIncluded: true,
  weights: [],
})

const state = (over: Partial<State> = {}): State => ({
  courses: [],
  reminder: '1d',
  step: 3,
  activeCourseId: null,
  lastExport: [],
  exportSequence: 0,
  ...over,
})

describe('planForAll', () => {
  it('counts everything as new on a first export', () => {
    const c = course('ECON 101', [ev({ id: 'a' })])
    const plan = planForAll([c], state())
    expect(plan.created).toBe(1)
    expect(plan.updated).toBe(0)
    expect(plan.cancelled).toBe(0)
  })

  it('counts a re-export of the same syllabus as an update, not a duplicate', () => {
    const c = course('ECON 101', [ev({ id: 'a' })])
    const first = planForAll([c], state())
    const plan = planForAll([c], state({ lastExport: first.entries, exportSequence: 1 }))
    expect(plan.updated).toBe(1)
    expect(plan.created).toBe(0)
  })

  it('still matches after the student edits the title and the date', () => {
    const before = course('ECON 101', [ev({ id: 'a', origDate: '2026-09-14', origTitle: 'Midterm' })])
    const first = planForAll([before], state())
    const after = course('ECON 101', [ev({ id: 'a', date: '2026-09-21', title: 'Midterm, ch 1-5', origDate: '2026-09-14', origTitle: 'Midterm' })])
    const plan = planForAll([after], state({ lastExport: first.entries, exportSequence: 1 }))
    expect(plan.updated).toBe(1)
    expect(plan.created).toBe(0)
    expect(plan.ics).toContain('DTSTART;VALUE=DATE:20260921')
  })

  it('withdraws an event the student has since removed', () => {
    const before = course('ECON 101', [ev({ id: 'a', title: 'Quiz' }), ev({ id: 'b', date: '2026-10-01', title: 'Essay' })])
    const first = planForAll([before], state())
    const after = course('ECON 101', [ev({ id: 'a', title: 'Quiz' })])
    const plan = planForAll([after], state({ lastExport: first.entries, exportSequence: 1 }))
    expect(plan.cancelled).toBe(1)
    expect(plan.ics).toContain('STATUS:CANCELLED')
    expect(plan.ics).toContain(`UID:${eventUid('ECON 101', { date: '2026-10-01', title: 'Essay' })}`)
  })

  it('raises the sequence so calendar apps accept the update', () => {
    const c = course('ECON 101', [ev({ id: 'a' })])
    expect(planForAll([c], state({ exportSequence: 0 })).ics).toContain('SEQUENCE:0')
    expect(planForAll([c], state({ exportSequence: 3 })).ics).toContain('SEQUENCE:3')
  })
})

describe('planForCourse', () => {
  it('never withdraws the other classes when only one is downloaded', () => {
    const econ = course('ECON 101', [ev({ id: 'a' })])
    const psyc = course('PSYC 101', [ev({ id: 'b', title: 'Paper' })])
    const both = planForAll([econ, psyc], state())
    const one = planForCourse(econ, state({ lastExport: both.entries, exportSequence: 1 }))
    expect(one.cancelled).toBe(0)
    expect(one.ics).not.toContain('STATUS:CANCELLED')
  })
})

describe('withdrawn', () => {
  it('is what the previous export had and this one does not', () => {
    const prev = [
      { uid: 'a', date: '2026-09-14', summary: 'X' },
      { uid: 'b', date: '2026-09-15', summary: 'Y' },
    ]
    expect(withdrawn(prev, [prev[0]])).toEqual([prev[1]])
  })
})

describe('mergeHistory', () => {
  it('folds a single-class export into the record without losing the rest', () => {
    const prev = [{ uid: 'a', date: '2026-09-14', summary: 'X' }]
    const added = [{ uid: 'b', date: '2026-09-15', summary: 'Y' }]
    expect(mergeHistory(prev, added).map((e) => e.uid).sort()).toEqual(['a', 'b'])
  })

  it('replaces an entry rather than repeating it', () => {
    const prev = [{ uid: 'a', date: '2026-09-14', summary: 'Old' }]
    const out = mergeHistory(prev, [{ uid: 'a', date: '2026-09-21', summary: 'New' }])
    expect(out).toEqual([{ uid: 'a', date: '2026-09-21', summary: 'New' }])
  })
})
