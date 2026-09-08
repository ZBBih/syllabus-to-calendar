// @vitest-environment jsdom
// Persistence: what survives a reload, and what is refused on the way back in.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { initialState, type Course, type State } from './store'
import { type ExtractedEvent } from './extract'
import { sanitize, createSaver, save, load, STORAGE_KEY } from './persist'

describe('sanitize', () => {
  it('rejects garbage', () => {
    expect(sanitize(null)).toBeNull()
    expect(sanitize('x')).toBeNull()
    expect(sanitize({ courses: 'nope' })).toBeNull()
    expect(sanitize({ courses: [{ nope: 1 }] })).toBeNull()
  })
  it('drops malformed events and fills defaults', () => {
    const s = sanitize({
      courses: [{ id: 'c1', name: 5, term: { season: 'Mars', year: 'x' }, events: [{ id: 'e1', date: '2026-09-14', title: 'ok' }, { bad: true }, 7] }],
      reminder: 'weird',
    })!
    expect(s.courses).toHaveLength(1)
    expect(s.courses[0].name).toBe('')
    expect(s.courses[0].term.season).toMatch(/Fall|Spring|Summer|Winter/)
    expect(s.courses[0].events).toHaveLength(1)
    expect(s.courses[0].events[0].include).toBe(true)
    expect(s.reminder).toBe('1d')
  })
})

describe('sanitize rejects malformed dates and times', () => {
  const stored = (course: Record<string, unknown>) => sanitize({ courses: [{ id: 'c1', name: 'X', ...course }] })

  it('blanks a date that is not a date, keeping the row to be fixed', () => {
    const s = stored({ events: [{ id: 'e1', date: '20260914\r\nSUMMARY:Injected', title: 'Exam' }] })
    expect(s?.courses[0].events[0].date).toBe('')
    expect(s?.courses[0].events[0].title).toBe('Exam')
  })

  it('keeps a well-formed date', () => {
    expect(stored({ events: [{ id: 'e1', date: '2026-09-14', title: 'Exam' }] })?.courses[0].events[0].date).toBe('2026-09-14')
  })

  it('rejects an impossible calendar date', () => {
    expect(stored({ events: [{ id: 'e1', date: '2026-02-31', title: 'Exam' }] })?.courses[0].events[0].date).toBe('')
  })

  it('drops a malformed time and end date', () => {
    const e = stored({
      events: [{ id: 'e1', date: '2026-09-14', title: 'Exam', time: '25:99', endDate: 'nope' }],
    })?.courses[0].events[0]
    expect(e?.time).toBeUndefined()
    expect(e?.endDate).toBeUndefined()
  })

  it('drops a meeting whose times are malformed', () => {
    const s = stored({
      events: [],
      meeting: { days: ['MO'], start: '09:00\r\nX-EVIL:1', end: '10:00', firstDate: '2026-09-14', untilDate: '2026-12-10' },
    })
    expect(s?.courses[0].meeting).toBeNull()
  })

  it('drops an export history entry with a tampered uid', () => {
    const s = sanitize({
      courses: [{ id: 'c1', name: 'X', events: [] }],
      lastExport: [
        { uid: 'u\r\nX-EVIL:1@syllabify.app', date: '2026-09-14', summary: 'a' },
        { uid: 'abc123@syllabify.app', date: '2026-09-14', summary: 'b' },
      ],
    })
    expect(s?.lastExport.map((e) => e.summary)).toEqual(['b'])
  })
})


/**
 * Saving on every keystroke means re-serialising every syllabus the student has loaded, which
 * for six classes is hundreds of kilobytes per character typed. The saver coalesces a burst of
 * changes into one write, and flushes on the way out so closing the tab mid-word loses nothing.
 */
describe('createSaver', () => {
  afterEach(() => vi.useRealTimers())

  const stateNamed = (name: string): State => ({
    ...initialState(),
    courses: [{ ...initialState().courses[0], name }],
  })

  it('does not write as the change arrives', () => {
    vi.useFakeTimers()
    const writes: string[] = []
    const saver = createSaver((s) => (writes.push(s.courses[0].name), true))
    saver.queue(stateNamed('P'))
    expect(writes).toEqual([])
  })

  it('writes once the typing stops', () => {
    vi.useFakeTimers()
    const writes: string[] = []
    const saver = createSaver((s) => (writes.push(s.courses[0].name), true))
    saver.queue(stateNamed('PSYC'))
    vi.advanceTimersByTime(400)
    expect(writes).toEqual(['PSYC'])
  })

  it('collapses a burst of keystrokes into a single write of the last one', () => {
    vi.useFakeTimers()
    const writes: string[] = []
    const saver = createSaver((s) => (writes.push(s.courses[0].name), true))
    for (const name of ['P', 'PS', 'PSY', 'PSYC']) {
      saver.queue(stateNamed(name))
      vi.advanceTimersByTime(100)
    }
    vi.advanceTimersByTime(400)
    expect(writes).toEqual(['PSYC'])
  })

  it('flush writes the pending state straight away', () => {
    vi.useFakeTimers()
    const writes: string[] = []
    const saver = createSaver((s) => (writes.push(s.courses[0].name), true))
    saver.queue(stateNamed('PSYC'))
    saver.flush()
    expect(writes).toEqual(['PSYC'])
  })

  it('flush does not write again when nothing is pending', () => {
    vi.useFakeTimers()
    const writes: string[] = []
    const saver = createSaver((s) => (writes.push(s.courses[0].name), true))
    saver.queue(stateNamed('PSYC'))
    saver.flush()
    saver.flush()
    vi.advanceTimersByTime(400)
    expect(writes).toEqual(['PSYC'])
  })

  it('reports a refused write so the page can warn about blocked storage', () => {
    vi.useFakeTimers()
    const refusals: boolean[] = []
    const saver = createSaver(() => false, 400, (ok) => refusals.push(ok))
    saver.queue(stateNamed('PSYC'))
    vi.advanceTimersByTime(400)
    expect(refusals).toEqual([false])
  })

  it('cancel drops a pending write, so erasing is not undone by it', () => {
    vi.useFakeTimers()
    const writes: string[] = []
    const saver = createSaver((s) => (writes.push(s.courses[0].name), true))
    saver.queue(stateNamed('PSYC'))
    saver.cancel()
    vi.advanceTimersByTime(400)
    expect(writes).toEqual([])
  })
})

/**
 * The guard on the split.
 *
 * A course's fields are listed once in the type, again in the reducer, and a third time in the
 * sanitizer that rebuilds it off disk. Forgetting the third is the failure this codebase is
 * most exposed to, and it is silent: the field works all session and is gone after a reload,
 * which a student experiences as the app losing their semester. `Required<T>` is what makes
 * this test fail at compile time — add an optional field to Course, ExtractedEvent or State and
 * TypeScript refuses to build this fixture until it is listed here, at which point the
 * round-trip assertion says whether the sanitizer keeps it.
 */
describe('everything a student can save survives a reload', () => {
  const event: Required<ExtractedEvent> = {
    id: 'e1',
    date: '2026-10-20',
    endDate: '2026-10-22',
    time: '09:30',
    title: 'Fall break',
    confidence: 'low',
    reason: 'date only',
    include: false,
    origDate: '2026-10-19',
    origTitle: 'Break',
    source: 'Oct 20-22: Fall break',
    missing: true,
    manual: true,
  }

  const course: Required<Course> = {
    id: 'c1',
    name: 'ECON 101',
    term: { season: 'Spring', year: 2027 },
    text: 'Oct 20-22: Fall break',
    events: [event],
    extracted: true,
    meeting: { days: ['MO', 'WE'], start: '10:00', end: '11:15', location: 'Hall B', firstDate: '2027-01-12', untilDate: '2027-05-01' },
    meetingIncluded: false,
    weights: [{ id: 'w1', label: 'Exams', weight: 40, earned: 88 }],
    diff: { added: ['e1'], moved: [{ id: 'e1', from: '2026-10-19', to: '2026-10-20' }], missing: ['e2'] },
    viaPhoto: true,
  }

  const full: Required<State> = {
    courses: [course],
    reminder: 'morning',
    step: 2,
    activeCourseId: 'c1',
    lastExport: [{ uid: 'abc123@syllabify.app', date: '2026-12-09', summary: 'Final paper' }],
    exportSequence: 3,
  }

  it('comes back off disk exactly as it went in', () => {
    expect(sanitize(JSON.parse(JSON.stringify(full)))).toEqual(full)
  })

  it('really is round-tripping through the browser, not just the sanitizer', () => {
    expect(save(full)).toBe(true)
    expect(load()).toEqual(full)
    localStorage.removeItem(STORAGE_KEY)
  })
})
