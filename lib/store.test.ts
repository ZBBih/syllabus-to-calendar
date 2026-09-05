import { describe, it, expect } from 'vitest'
import { reducer, initialState, defaultTerm } from './store'

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
