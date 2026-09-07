import { describe, it, expect } from 'vitest'
import { reducer, initialState, defaultTerm, sanitize, type State } from './store'
import { extractEvents } from './extract'

describe('store', () => {
  it('starts with one course', () => {
    expect(initialState().courses).toHaveLength(1)
  })
  it('add appends, and removing the last class leaves a blank one', () => {
    const s1 = reducer(initialState(), { type: 'add' })
    expect(s1.courses).toHaveLength(2)
    const s2 = reducer(s1, { type: 'remove', id: s1.courses[0].id })
    expect(s2.courses).toHaveLength(1)
    // Removing the only class leaves a fresh blank one rather than an empty screen.
    const emptied = reducer(s2, { type: 'remove', id: s2.courses[0].id })
    expect(emptied.courses).toHaveLength(1)
    expect(emptied.courses[0].id).not.toBe(s2.courses[0].id)
    expect(emptied.courses[0].name).toBe('')
  })
  it('defaultTerm picks the term in progress', () => {
    expect(defaultTerm(new Date(2026, 8, 5))).toEqual({ season: 'Fall', year: 2026 })
    expect(defaultTerm(new Date(2026, 11, 20))).toEqual({ season: 'Spring', year: 2027 })
  })
})

describe('store: files and re-runs', () => {
  const fall = { season: 'Fall' as const, year: 2026 }
  const withText = (s: State, text: string): State =>
    reducer(s, { type: 'update', id: s.courses[0].id, patch: { text, term: fall } })

  it('addFromFiles fills the blank first card, then adds cards', () => {
    const s = reducer(initialState(), {
      type: 'addFromFiles',
      files: [
        { name: 'ECON101', text: 'Sept 14: Quiz 1' },
        { name: 'PSYC 200', text: 'Oct 2: Paper due' },
      ],
    })
    expect(s.courses).toHaveLength(2)
    expect(s.courses[0]).toMatchObject({ name: 'ECON101', extracted: true })
    expect(s.courses[1]).toMatchObject({ name: 'PSYC 200', extracted: true })
    expect(s.courses[0].events).toHaveLength(1)
  })

  it('addFromFiles never overwrites a typed name', () => {
    let s = initialState()
    s = reducer(s, { type: 'update', id: s.courses[0].id, patch: { name: 'My Class' } })
    s = reducer(s, { type: 'addFromFiles', files: [{ name: 'ECON101', text: 'Sept 14: Quiz 1' }] })
    expect(s.courses).toHaveLength(2)
    expect(s.courses[0].name).toBe('My Class')
    expect(s.courses[1].name).toBe('ECON101')
  })

  it('mergeEvents keeps edits on re-run', () => {
    let s = withText(initialState(), 'Sept 14: Quiz 1')
    const id = s.courses[0].id
    s = reducer(s, { type: 'extractAll' })
    const evId = s.courses[0].events[0].id
    s = reducer(s, { type: 'updateEvent', courseId: id, eventId: evId, patch: { title: 'Quiz 1 (edited)', include: false } })
    s = withText(s, 'Sept 14: Quiz 1\nOct 2: Paper')
    s = reducer(s, { type: 'extractAll' })
    expect(s.courses[0].events).toHaveLength(2)
    expect(s.courses[0].events[0]).toMatchObject({ id: evId, title: 'Quiz 1 (edited)', include: false })
  })

  it('extractAll skips courses with no text', () => {
    let s = reducer(initialState(), { type: 'add' })
    s = withText(s, 'Sept 14: Quiz 1')
    s = reducer(s, { type: 'extractAll' })
    expect(s.courses[0].extracted).toBe(true)
    expect(s.courses[1].extracted).toBe(false)
  })
})

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

describe('flow state', () => {
  it('starts on the landing page with no active course and persists step/active through sanitize', () => {
    const s = initialState()
    expect(s.step).toBe(0) // a first visit lands on the front page, not the drop zone
    expect(s.activeCourseId).toBeNull()
    const s2 = reducer(reducer(s, { type: 'setStep', step: 3 }), { type: 'setActive', id: s.courses[0].id })
    const back = sanitize(JSON.parse(JSON.stringify(s2)))!
    expect(back.step).toBe(3)
    expect(back.activeCourseId).toBe(s.courses[0].id)
    expect(sanitize({ courses: [{ id: 'c' }], step: 9, activeCourseId: 'ghost' })).toMatchObject({ step: 0, activeCourseId: null })
  })
  it('setIncludeAll flips every row and removing the active course clears it', () => {
    let s = reducer(initialState(), { type: 'update', id: initialState().courses[0].id, patch: {} })
    const id = s.courses[0].id
    s = reducer(s, { type: 'setEvents', id, events: [
      { id: 'a', date: '2026-09-01', title: 'A', confidence: 'high', include: true },
      { id: 'b', date: '2026-09-02', title: 'B', confidence: 'high', include: true },
    ] })
    s = reducer(s, { type: 'setIncludeAll', courseId: id, include: false })
    expect(s.courses[0].events.every((e) => e.include === false)).toBe(true)
    s = reducer(reducer(s, { type: 'add' }), { type: 'setActive', id })
    s = reducer(s, { type: 'remove', id })
    expect(s.activeCourseId).toBeNull()
  })
})

const SYL = `PSYC 101
MWF 10:00-10:50 in Olin 204

Grading
Homework 40%
Final exam 60%

Sept 16  Quiz 1
Oct 14   Midterm exam`

describe('reducer, second pass over a syllabus', () => {
  it('reads dates, the meeting and the grading table from one dropped file', () => {
    const s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL }] })
    const c = s.courses[0]
    expect(c.events.length).toBeGreaterThanOrEqual(2)
    expect(c.meeting).toMatchObject({ days: ['MO', 'WE', 'FR'] })
    expect(c.weights?.map((w) => w.label)).toEqual(['Homework', 'Final exam'])
    expect(c.viaPhoto).toBe(false)
  })

  it('marks a class that came from a photo', () => {
    const s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL, viaPhoto: true }] })
    expect(s.courses[0].viaPhoto).toBe(true)
  })

  it('reports what a revised file changed and keeps the entered grade', () => {
    let s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL }] })
    const id = s.courses[0].id
    const homework = s.courses[0].weights![0]
    s = reducer(s, { type: 'updateWeight', courseId: id, weightId: homework.id, patch: { earned: 88 } })

    const revised = SYL.replace('Oct 14   Midterm exam', 'Oct 21   Midterm exam')
    s = reducer(s, { type: 'update', id, patch: { text: revised } })
    s = reducer(s, { type: 'mergeEvents', id, events: extractEvents(revised, s.courses[0].term) })

    expect(s.courses[0].diff!.moved).toHaveLength(1)
    expect(s.courses[0].weights!.find((w) => w.label === 'Homework')!.earned).toBe(88)
  })

  it('dismissing the change summary leaves the rows alone', () => {
    let s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL }] })
    const id = s.courses[0].id
    const before = s.courses[0].events.length
    s = reducer(s, { type: 'dismissDiff', courseId: id })
    expect(s.courses[0].events).toHaveLength(before)
    expect(s.courses[0].diff).toEqual({ added: [], moved: [], missing: [] })
  })

  it('recording an export raises the sequence so the next file is accepted as an update', () => {
    let s = initialState()
    s = reducer(s, { type: 'recordExport', entries: [{ uid: 'u', date: '2026-09-14', summary: 'X' }] })
    expect(s.exportSequence).toBe(1)
    expect(s.lastExport).toHaveLength(1)
  })

  it('starting over keeps the export history, so the calendar is corrected rather than duplicated', () => {
    let s = reducer(initialState(), { type: 'recordExport', entries: [{ uid: 'u', date: '2026-09-14', summary: 'X' }] })
    s = reducer(s, { type: 'clear' })
    expect(s.courses).toHaveLength(1)
    expect(s.lastExport).toHaveLength(1)
    expect(s.exportSequence).toBe(1)
  })

  it('survives a round trip through storage with the new fields intact', () => {
    let s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL, viaPhoto: true }] })
    s = reducer(s, { type: 'recordExport', entries: [{ uid: 'u', date: '2026-09-14', summary: 'X' }] })
    const back = sanitize(JSON.parse(JSON.stringify(s)))!
    expect(back.courses[0].viaPhoto).toBe(true)
    expect(back.courses[0].weights).toHaveLength(2)
    expect(back.lastExport).toEqual(s.lastExport)
    expect(back.exportSequence).toBe(1)
  })

  it('reads a state saved before these fields existed', () => {
    const legacy = { courses: [{ id: 'c1', name: 'X', events: [], term: { season: 'Fall', year: 2026 } }], reminder: '1d', step: 1 }
    const back = sanitize(legacy)!
    expect(back.exportSequence).toBe(0)
    expect(back.lastExport).toEqual([])
    expect(back.courses[0].weights).toEqual([])
    expect(back.courses[0].viaPhoto).toBeUndefined()
  })
})

describe('the landing gate', () => {
  it('sends a first visit to the front page', () => {
    expect(initialState().step).toBe(0)
    expect(sanitize({ courses: [{ id: 'c', name: '', events: [], text: '' }], reminder: '1d' })!.step).toBe(0)
  })

  it('sends someone with work in progress back to their flow, not the sales pitch', () => {
    const saved = { courses: [{ id: 'c', name: 'ECON', text: 'Sept 14 Quiz', events: [] }], reminder: '1d' }
    expect(sanitize(saved)!.step).toBe(1)
  })

  it('keeps an explicitly saved step', () => {
    const saved = { courses: [{ id: 'c', name: 'ECON', text: 'x', events: [] }], reminder: '1d', step: 3 }
    expect(sanitize(saved)!.step).toBe(3)
  })

  it('starting over returns to the front page', () => {
    let s = reducer(initialState(), { type: 'setStep', step: 3 })
    s = reducer(s, { type: 'clear' })
    expect(s.step).toBe(0)
  })
})

describe('store: term and name read from the syllabus', () => {
  it('changing the term re-reads the syllabus and recovers the dates it was hiding', () => {
    // Read under Fall 2026 a May deadline is past the end of the term window and is dropped.
    const s = reducer(initialState(), {
      type: 'addFromFiles',
      files: [{ name: 'MATH 21', text: 'May 4: Final exam' }],
    })
    const id = s.courses[0].id
    const fall = reducer(s, { type: 'setTerm', id, term: { season: 'Fall', year: 2026 } })
    expect(fall.courses[0].events).toHaveLength(0)

    const spring = reducer(fall, { type: 'setTerm', id, term: { season: 'Spring', year: 2027 } })
    expect(spring.courses[0].term).toEqual({ season: 'Spring', year: 2027 })
    expect(spring.courses[0].events.map((e) => e.date)).toEqual(['2027-05-04'])
  })

  it('changing the term keeps a title the student has edited', () => {
    const s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'X', text: 'Sept 14: Quiz 1' }] })
    const id = s.courses[0].id
    const edited = reducer(s, {
      type: 'updateEvent',
      courseId: id,
      eventId: s.courses[0].events[0].id,
      patch: { title: 'Quiz 1 (open book)' },
    })
    const again = reducer(edited, { type: 'setTerm', id, term: { season: 'Fall', year: 2026 } })
    expect(again.courses[0].events[0].title).toBe('Quiz 1 (open book)')
  })

  it('a term set before there is any text is simply stored', () => {
    const s0 = initialState()
    const s = reducer(s0, { type: 'setTerm', id: s0.courses[0].id, term: { season: 'Winter', year: 2026 } })
    expect(s.courses[0].term).toEqual({ season: 'Winter', year: 2026 })
    expect(s.courses[0].extracted).toBe(false)
  })

  it('takes the class name from the text when the file name gives nothing', () => {
    const s = reducer(initialState(), {
      type: 'addFromFiles',
      files: [{ name: '', text: 'PSYC 101: Introduction to Psychology\nFall 2026\nSept 14: Quiz 1' }],
    })
    expect(s.courses[0].name).toBe('PSYC 101')
  })

  it('a course code in the text beats a file name that is not one', () => {
    const s = reducer(initialState(), {
      type: 'addFromFiles',
      files: [{ name: 'IMG 4821', text: 'CHEM 120: General Chemistry\nSept 15 Lab notebook check', viaPhoto: true }],
    })
    expect(s.courses[0].name).toBe('CHEM 120')
  })

  it('a file name that is itself a course code still wins', () => {
    const s = reducer(initialState(), {
      type: 'addFromFiles',
      files: [{ name: 'BIOL 210', text: 'PSYC 101: Introduction to Psychology\nSept 14: Quiz 1' }],
    })
    expect(s.courses[0].name).toBe('BIOL 210')
  })

  it('takes the term from the text so out-of-window dates survive', () => {
    const s = reducer(initialState(), {
      type: 'addFromFiles',
      files: [{ name: 'MATH 21', text: 'MATH 21\nSpring 2027\nFeb 2: Problem set 1' }],
    })
    expect(s.courses[0].term).toEqual({ season: 'Spring', year: 2027 })
    expect(s.courses[0].events.map((e) => e.date)).toEqual(['2027-02-02'])
  })

  it('keeps an end date across a save and a load', () => {
    const state = initialState()
    const course = state.courses[0]
    const saved = {
      ...state,
      courses: [{ ...course, events: [{ id: 'e1', date: '2026-10-20', endDate: '2026-10-21', title: 'Fall break', confidence: 'high', include: true }] }],
    }
    const back = sanitize(JSON.parse(JSON.stringify(saved)))
    expect(back?.courses[0].events[0].endDate).toBe('2026-10-21')
  })
})

describe('store: keeping a date from the read report', () => {
  it('adds a row carrying the date, the title and the syllabus line', () => {
    const s0 = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'MATH 21', text: 'Sept 14: Quiz' }] })
    const id = s0.courses[0].id
    const s1 = reducer(s0, {
      type: 'addEvent',
      courseId: id,
      preset: { date: '2027-05-04', title: 'Final exam', source: 'May 4: Final exam' },
    })
    const row = s1.courses[0].events.at(-1)!
    expect(row).toMatchObject({
      date: '2027-05-04',
      title: 'Final exam',
      source: 'May 4: Final exam',
      include: true,
      confidence: 'low',
      reason: 'added from the syllabus text',
    })
  })

  it('a plain Row is still blank', () => {
    const s0 = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'MATH 21', text: 'Sept 14: Quiz' }] })
    const s1 = reducer(s0, { type: 'addEvent', courseId: s0.courses[0].id })
    expect(s1.courses[0].events.at(-1)).toMatchObject({ date: '', title: '', confidence: 'high' })
  })

  it('a kept row has no original date, so a re-read never claims it went missing', () => {
    const s0 = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'MATH 21', text: 'Sept 14: Quiz' }] })
    const id = s0.courses[0].id
    const s1 = reducer(s0, {
      type: 'addEvent',
      courseId: id,
      preset: { date: '2027-05-04', title: 'Final exam', source: 'May 4: Final exam' },
    })
    const s2 = reducer(s1, { type: 'mergeEvents', id, events: extractEvents('Sept 14: Quiz', { season: 'Fall', year: 2026 }) })
    expect(s2.courses[0].events.find((e) => e.title === 'Final exam')?.missing).toBeUndefined()
  })
})

