// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { UploadStep, canProceed, unnamedCount } from './upload-step'
import { initialState, type Course, type State } from '@/lib/store'

afterEach(cleanup)

const blank: State = initialState()

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

describe('UploadStep', () => {
  it('shows a bin on every class row, including the only one', () => {
    const withClass: State = {
      ...blank,
      courses: [
        {
          ...blank.courses[0],
          name: 'ECON 101',
          text: 'Sept 14 Quiz',
          events: [{ id: 'a', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true }],
        },
      ],
    }
    render(<UploadStep state={withClass} dispatch={() => {}} />)
    expect(screen.getByRole('button', { name: /remove econ 101/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /clear all/i })).toBeNull()
  })
})
