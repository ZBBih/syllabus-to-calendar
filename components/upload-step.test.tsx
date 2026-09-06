// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { canProceed, unnamedCount } from './upload-step'
import type { Course } from '@/lib/store'

const c = (name: string, n: number): Course => ({
  id: name || 'x',
  name,
  term: { season: 'Fall', year: 2026 },
  text: 'x',
  extracted: true,
  events: Array.from({ length: n }, (_, i) => ({ id: `${name}${i}`, date: '2026-09-14', title: 'T', confidence: 'high' as const, include: true })),
})

describe('Upload gate', () => {
  it('blocks when any class with dates is unnamed, even if another is named', () => {
    expect(canProceed([c('ECON 101', 2), c('', 3)])).toBe(false)
    expect(unnamedCount([c('ECON 101', 2), c('', 3)])).toBe(1)
  })
  it('ignores unnamed classes that have no dates', () => {
    expect(canProceed([c('ECON 101', 2), c('', 0)])).toBe(true)
  })
  it('needs at least one class with dates', () => {
    expect(canProceed([c('ECON 101', 0)])).toBe(false)
  })
})
