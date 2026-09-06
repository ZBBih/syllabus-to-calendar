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
