import { describe, it, expect } from 'vitest'
import { termFromText } from './term'

describe('termFromText', () => {
  it('reads a season and a four-digit year', () => {
    expect(termFromText('PSYC 101: Introduction to Psychology\nFall 2026\nOlin 204')).toEqual({ season: 'Fall', year: 2026 })
    expect(termFromText('Spring 2027 — MATH 21')).toEqual({ season: 'Spring', year: 2027 })
  })

  it('reads autumn as fall', () => {
    expect(termFromText('Autumn 2026 syllabus')).toEqual({ season: 'Fall', year: 2026 })
  })

  it('reads a two-digit year', () => {
    expect(termFromText("Spring '27 course outline")).toEqual({ season: 'Spring', year: 2027 })
  })

  it('takes the first mention, not a later one', () => {
    expect(termFromText('Fall 2026\nRegistration for Spring 2027 opens in November')).toEqual({ season: 'Fall', year: 2026 })
  })

  it('returns null when there is no term to read', () => {
    expect(termFromText('Introduction to Psychology\nDr Alvarez\nOffice hours Tuesday')).toBeNull()
    expect(termFromText('')).toBeNull()
  })

  it('ignores a season named far down the page', () => {
    expect(termFromText(`${'filler line\n'.repeat(60)}Fall 2026`)).toBeNull()
  })
})
