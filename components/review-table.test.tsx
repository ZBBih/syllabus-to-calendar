// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReviewTable } from './review-table'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course: Course = {
  id: 'c1',
  name: 'ECON 101',
  term: { season: 'Fall', year: 2026 },
  text: '',
  events: [{ id: 'e1', date: '2026-09-14', title: 'Quiz', confidence: 'low', reason: 'date only', include: true }],
  extracted: true,
}

describe('ReviewTable', () => {
  it('flags low-confidence rows and clears the flag when the title is edited', () => {
    const dispatch = vi.fn()
    render(<ReviewTable course={course} dispatch={dispatch} />)
    expect(screen.getByText(/check this one: date only/i)).toBeTruthy()
    fireEvent.change(screen.getByDisplayValue('Quiz'), { target: { value: 'Quiz 1' } })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'updateEvent',
      courseId: 'c1',
      eventId: 'e1',
      patch: { title: 'Quiz 1', confidence: 'high', reason: undefined },
    })
  })

  it('unchecking include dispatches include false', () => {
    const dispatch = vi.fn()
    render(<ReviewTable course={course} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'updateEvent', patch: { include: false } }))
  })
})
