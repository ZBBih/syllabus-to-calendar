// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
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

describe('UploadStep clear', () => {
  it('offers a clear once classes exist and only clears after a confirm', () => {
    const dispatch = vi.fn()
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
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<UploadStep state={withClass} dispatch={dispatch} />)

    const clear = screen.getByRole('button', { name: /clear all/i })
    fireEvent.click(clear)
    expect(confirmSpy).toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'clear' })

    confirmSpy.mockReturnValue(true)
    fireEvent.click(clear)
    expect(dispatch).toHaveBeenCalledWith({ type: 'clear' })
    confirmSpy.mockRestore()
  })

  it('does not offer a clear when there is nothing to clear', () => {
    render(<UploadStep state={blank} dispatch={() => {}} />)
    expect(screen.queryByRole('button', { name: /clear all/i })).toBeNull()
  })
})
