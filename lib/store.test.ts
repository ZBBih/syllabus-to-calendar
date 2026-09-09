import { describe, it, expect } from 'vitest'
import { reducer, initialState, defaultTerm, type State } from './store'
import { sanitize } from './persist'
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
    const reread = (st: State) => reducer(st, { type: 'mergeEvents', id, events: extractEvents(st.courses[0].text, fall) })
    s = reread(s)
    const evId = s.courses[0].events[0].id
    s = reducer(s, { type: 'updateEvent', courseId: id, eventId: evId, patch: { title: 'Quiz 1 (edited)', include: false } })
    s = withText(s, 'Sept 14: Quiz 1\nOct 2: Paper')
    s = reread(s)
    expect(s.courses[0].events).toHaveLength(2)
    expect(s.courses[0].events[0]).toMatchObject({ id: evId, title: 'Quiz 1 (edited)', include: false })
  })

  /**
   * A re-read may move a deadline the professor moved, but never one the student typed. The
   * two used to be told apart by comparing the date against the original, which stopped
   * working the moment a re-read was allowed to move a row without re-seeding that original.
   */
  it('marks a row the student re-dated so a later re-read leaves it alone', () => {
    let s = withText(initialState(), 'Sept 14: Quiz 1')
    const id = s.courses[0].id
    s = reducer(s, { type: 'mergeEvents', id, events: extractEvents(s.courses[0].text, fall) })
    const evId = s.courses[0].events[0].id
    s = reducer(s, { type: 'updateEvent', courseId: id, eventId: evId, patch: { date: '2026-09-16' } })
    expect(s.courses[0].events[0].userDated).toBe(true)
  })

  it('leaves a row alone when the student edits something other than its date', () => {
    let s = withText(initialState(), 'Sept 14: Quiz 1')
    const id = s.courses[0].id
    s = reducer(s, { type: 'mergeEvents', id, events: extractEvents(s.courses[0].text, fall) })
    const evId = s.courses[0].events[0].id
    s = reducer(s, { type: 'updateEvent', courseId: id, eventId: evId, patch: { title: 'Quiz one' } })
    expect(s.courses[0].events[0].userDated).toBeUndefined()
  })

  /**
   * The drop zone is where a student puts a revised syllabus, because it is the only place on
   * the screen that takes a file. Adding a second class of the same name silently split the
   * term in two and buried the change report that is the reason to re-read at all.
   */
  it('re-reads the class a dropped file belongs to instead of adding it twice', () => {
    let s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL }] })
    s = reducer(s, { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL.replace('Oct 14', 'Oct 21') }] })
    expect(s.courses).toHaveLength(1)
    expect(s.courses[0].events).toHaveLength(2)
    expect(s.courses[0].diff?.moved).toHaveLength(1)
  })

  it('still adds a class whose name is new', () => {
    let s = reducer(initialState(), { type: 'addFromFiles', files: [{ name: 'PSYC 101', text: SYL }] })
    s = reducer(s, { type: 'addFromFiles', files: [{ name: 'BIOL 210', text: 'Nov 3 Lab report due' }] })
    expect(s.courses.map((c) => c.name)).toEqual(['PSYC 101', 'BIOL 210'])
  })

  it('changing the term of a class with no syllabus yet just moves the term', () => {
    // Re-reading is what a term change is for, and there is nothing to re-read here. The course
    // has to come back with the new term and still be marked unextracted, or the upload screen
    // would claim a blank class had been read.
    const blank = initialState()
    const s = reducer(blank, { type: 'setTerm', id: blank.courses[0].id, term: fall })
    expect(s.courses[0].extracted).toBe(false)
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


/**
 * Restored site data is the one input to this app that no person typed. The event shapes were
 * already checked for being strings; these check they are the strings they claim to be, so a
 * tampered store cannot put a value into the calendar file that a date field never could.
 */
/**
 * "Start over" kept the export history so a later export could correct the calendar an
 * earlier one wrote to rather than duplicating onto it. The history carried every exported
 * assignment title, though, so starting over on a shared machine left a readable list of what
 * the student was studying and when it was due. Retraction matches on UID alone, so the titles
 * can go without the calendar behaviour changing.
 */
describe('starting over leaves no titles behind', () => {
  const withHistory = (): State => ({
    ...initialState(),
    lastExport: [
      { uid: 'a1@syllabify.app', date: '2026-12-09', summary: 'PSYC 101: Final paper due' },
      { uid: 'b2@syllabify.app', date: '2026-10-14', summary: 'PSYC 101: Midterm exam' },
    ],
    exportSequence: 3,
  })

  it('blanks every exported title', () => {
    const after = reducer(withHistory(), { type: 'clear' })
    expect(after.lastExport.map((e) => e.summary)).toEqual(['', ''])
  })

  it('keeps the identity and date each withdrawal needs', () => {
    const after = reducer(withHistory(), { type: 'clear' })
    expect(after.lastExport.map((e) => e.uid)).toEqual(['a1@syllabify.app', 'b2@syllabify.app'])
    expect(after.lastExport.map((e) => e.date)).toEqual(['2026-12-09', '2026-10-14'])
  })

  it('keeps the export sequence rising so the calendar accepts the correction', () => {
    expect(reducer(withHistory(), { type: 'clear' }).exportSequence).toBe(3)
  })
})

/**
 * Start over is not erasure: it deliberately keeps enough to correct the calendar. A student
 * on a library machine needs the other thing, which nothing in the app offered.
 */
describe('erasing everything on this device', () => {
  const used = (): State => ({
    ...initialState(),
    courses: [{ ...initialState().courses[0], name: 'PSYC 101', text: 'Final paper due Dec 9' }],
    lastExport: [{ uid: 'a1@syllabify.app', date: '2026-12-09', summary: 'PSYC 101: Final paper due' }],
    exportSequence: 3,
    step: 3,
  })

  it('leaves no course text behind', () => {
    const after = reducer(used(), { type: 'reset' })
    expect(after.courses).toHaveLength(1)
    expect(after.courses[0].name).toBe('')
    expect(after.courses[0].text).toBe('')
  })

  it('forgets the export history entirely, unlike starting over', () => {
    const after = reducer(used(), { type: 'reset' })
    expect(after.lastExport).toEqual([])
    expect(after.exportSequence).toBe(0)
  })

  it('returns to the landing page', () => {
    expect(reducer(used(), { type: 'reset' }).step).toBe(0)
  })
})
