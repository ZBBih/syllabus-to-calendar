import { describe, it, expect } from 'vitest'
import { reducer, initialState, defaultTerm, sanitize, type State } from './store'

describe('store', () => {
  it('starts with one course', () => {
    expect(initialState().courses).toHaveLength(1)
  })
  it('add appends, remove refuses last', () => {
    const s1 = reducer(initialState(), { type: 'add' })
    expect(s1.courses).toHaveLength(2)
    const s2 = reducer(s1, { type: 'remove', id: s1.courses[0].id })
    expect(s2.courses).toHaveLength(1)
    expect(reducer(s2, { type: 'remove', id: s2.courses[0].id }).courses).toHaveLength(1)
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
