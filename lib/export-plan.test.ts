import { describe, it, expect } from 'vitest'
import { planForAll, planForCourse, withdrawn, mergeHistory } from './export'
import { courseTag, eventUid } from './uid'
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

  it('withdraws a row this class has lost since the last export', () => {
    const before = course('ECON 101', [ev({ id: 'a', title: 'Quiz' }), ev({ id: 'b', date: '2026-10-01', title: 'Essay' })])
    const psyc = course('PSYC 101', [ev({ id: 'c', date: '2026-11-02', title: 'Paper' })])
    const first = planForAll([before, psyc], state())
    const after = course('ECON 101', [ev({ id: 'a', title: 'Quiz' })])
    const one = planForCourse(after, state({ courses: [after, psyc], lastExport: first.entries, exportSequence: 1 }))
    expect(one.cancelled).toBe(1)
    expect(one.ics).toContain('STATUS:CANCELLED')
    expect(one.ics).toContain(`UID:${eventUid('ECON 101', { date: '2026-10-01', title: 'Essay' })}`)
    // The other class was not in this file at all, so its row must survive it.
    expect(one.ics).not.toContain(`UID:${eventUid('PSYC 101', { date: '2026-11-02', title: 'Paper' })}`)
  })

  it('withdraws a row the student has unticked rather than deleted', () => {
    const before = course('ECON 101', [ev({ id: 'a', title: 'Quiz' }), ev({ id: 'b', date: '2026-10-01', title: 'Essay' })])
    const first = planForAll([before], state())
    const after = course('ECON 101', [ev({ id: 'a', title: 'Quiz' }), ev({ id: 'b', date: '2026-10-01', title: 'Essay', include: false })])
    const one = planForCourse(after, state({ courses: [after], lastExport: first.entries, exportSequence: 1 }))
    expect(one.cancelled).toBe(1)
    expect(one.ics).toContain(`UID:${eventUid('ECON 101', { date: '2026-10-01', title: 'Essay' })}`)
  })

  it('leaves an entry saved before the class tag existed alone', () => {
    // A history row written by an older build carries no tag, so no class can claim it. A full
    // export still withdraws it; a per-class file must not guess.
    const c = course('ECON 101', [ev({ id: 'a', title: 'Quiz' })])
    const legacy = { uid: 'oldrow@syllabify.app', date: '2026-10-01', summary: '' }
    const one = planForCourse(c, state({ courses: [c], lastExport: [legacy], exportSequence: 1 }))
    expect(one.cancelled).toBe(0)
    expect(one.ics).not.toContain('STATUS:CANCELLED')
  })
})

describe('mergeHistory', () => {
  it('replaces the exported class\'s rows rather than piling onto them', () => {
    const before = course('ECON 101', [ev({ id: 'a', title: 'Quiz' }), ev({ id: 'b', date: '2026-10-01', title: 'Essay' })])
    const psyc = course('PSYC 101', [ev({ id: 'c', date: '2026-11-02', title: 'Paper' })])
    const first = planForAll([before, psyc], state())
    expect(first.entries).toHaveLength(3)

    // ECON loses a row, and only ECON is downloaded.
    const after = course('ECON 101', [ev({ id: 'a', title: 'Quiz' })])
    const st = state({ courses: [after, psyc], lastExport: first.entries, exportSequence: 1 })
    const one = planForCourse(after, st)
    const history = mergeHistory(st.lastExport, one.entries, courseTag('ECON 101'))

    // The withdrawn row is gone from the history, PSYC is untouched, and nothing doubled up.
    expect(history).toHaveLength(2)
    expect(history.some((e) => e.uid === eventUid('ECON 101', { date: '2026-10-01', title: 'Essay' }))).toBe(false)
    expect(history.some((e) => e.uid === eventUid('PSYC 101', { date: '2026-11-02', title: 'Paper' }))).toBe(true)

    // And the next export of the same class does not cancel it a second time.
    const again = planForCourse(after, state({ courses: [after, psyc], lastExport: history, exportSequence: 2 }))
    expect(again.cancelled).toBe(0)
  })

  it('keeps every class when no class is named', () => {
    const a = { uid: 'a@syllabify.app', date: '2026-09-14', summary: 'X', courseTag: courseTag('ECON 101') }
    const b = { uid: 'b@syllabify.app', date: '2026-09-15', summary: 'Y', courseTag: courseTag('PSYC 101') }
    expect(mergeHistory([a, b], []).map((e) => e.uid).sort()).toEqual(['a@syllabify.app', 'b@syllabify.app'])
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

describe('planForAll: taking it all back off', () => {
  it('cancels the rows on screen even when this browser has no export history', () => {
    // The import was made from a phone, or the site data holding the history was cleared. A
    // calendar identity is a content hash, so the same rows still name the same events.
    const c = course('ECON 101', [ev({ id: 'a' }), ev({ id: 'b', date: '2026-10-01', title: 'Essay' })])
    const untouched = { ...c, events: c.events.map((e) => ({ ...e, include: false })) }
    const plan = planForAll([], state({ courses: [untouched] }))
    expect(plan.entries).toEqual([])
    expect(plan.cancelled).toBe(2)
    expect(plan.ics).toContain(`UID:${eventUid('ECON 101', c.events[0])}`)
    expect(plan.ics.match(/STATUS:CANCELLED/g)).toHaveLength(2)
  })

  it('does not offer a retraction for a class with no name to hash', () => {
    const c = course('', [ev({ id: 'a', include: false })])
    expect(planForAll([], state({ courses: [c] })).cancelled).toBe(0)
  })

  it('counts a row once when it is both in the history and on screen', () => {
    const c = course('ECON 101', [ev({ id: 'a', include: false })])
    const uid = eventUid('ECON 101', c.events[0])
    const plan = planForAll(
      [],
      state({ courses: [c], lastExport: [{ uid, date: '2026-09-14', summary: 'ECON 101: Midterm' }] }),
    )
    expect(plan.cancelled).toBe(1)
  })

  it('builds a file of nothing but cancellations when no row is ticked', () => {
    const plan = planForAll(
      [],
      state({
        lastExport: [
          { uid: 'u1@syllabify.app', date: '2026-09-14', summary: 'ECON 101: Quiz' },
          { uid: 'u2@syllabify.app', date: '2026-10-01', summary: 'ECON 101: Essay' },
        ],
      }),
    )
    expect(plan.entries).toEqual([])
    expect(plan.cancelled).toBe(2)
    expect(plan.ics.match(/STATUS:CANCELLED/g)).toHaveLength(2)
    expect(plan.ics).toContain('UID:u1@syllabify.app')
  })
})

