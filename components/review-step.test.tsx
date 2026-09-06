// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReviewStep } from './review-step'
import type { State } from '@/lib/store'

afterEach(cleanup)

const state: State = {
  step: 2,
  reminder: '1d',
  activeCourseId: null,
  lastExport: [],
  exportSequence: 0,
  courses: [
    {
      id: 'c1',
      name: 'ECON 101',
      term: { season: 'Fall', year: 2026 },
      text: 'x',
      extracted: true,
      events: [
        { id: 'a', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true },
        { id: 'b', date: '2026-09-21', title: 'Essay', confidence: 'low', reason: 'date only', include: true },
      ],
    },
  ],
}

describe('ReviewStep', () => {
  it('select all / none dispatch setIncludeAll for the active course', () => {
    const dispatch = vi.fn()
    render(<ReviewStep state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /^none$/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setIncludeAll', courseId: 'c1', include: false })
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setIncludeAll', courseId: 'c1', include: true })
  })
  it('needs-check filter hides confident rows', () => {
    render(<ReviewStep state={state} dispatch={() => {}} />)
    expect(screen.getByDisplayValue('Quiz')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /needs check/i }))
    expect(screen.queryByDisplayValue('Quiz')).toBeNull()
    expect(screen.getByDisplayValue('Essay')).toBeTruthy()
  })
})

describe('ReviewStep selection controls', () => {
  it('lights All when every row is in, and None when none are', () => {
    const { rerender } = render(<ReviewStep state={state} dispatch={() => {}} />)
    expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /^none$/i }).getAttribute('aria-pressed')).toBe('false')

    const off: State = {
      ...state,
      courses: [{ ...state.courses[0], events: state.courses[0].events.map((e) => ({ ...e, include: false })) }],
    }
    rerender(<ReviewStep state={off} dispatch={() => {}} />)
    expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: /^none$/i }).getAttribute('aria-pressed')).toBe('true')
  })

  it('turning on Needs check drops the All highlight, and picking All turns the filter back off', () => {
    render(<ReviewStep state={state} dispatch={() => {}} />)
    const all = () => screen.getByRole('button', { name: /^all$/i })
    const filter = () => screen.getByRole('button', { name: /needs check/i })

    expect(all().getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(filter())
    expect(filter().getAttribute('aria-pressed')).toBe('true')
    expect(all().getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(all())
    expect(filter().getAttribute('aria-pressed')).toBe('false')
  })

  it('disables the filter when there is nothing to check', () => {
    const clean: State = {
      ...state,
      courses: [{ ...state.courses[0], events: state.courses[0].events.map((e) => ({ ...e, confidence: 'high' as const })) }],
    }
    render(<ReviewStep state={clean} dispatch={() => {}} />)
    expect((screen.getByRole('button', { name: /needs check/i }) as HTMLButtonElement).disabled).toBe(true)
  })
})
