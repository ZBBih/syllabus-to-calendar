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

  it('shows a range\'s last day and drops the range when it is dismissed', () => {
    const dispatch = vi.fn()
    const ranged: Course = {
      ...course,
      events: [{ id: 'e1', date: '2026-10-20', endDate: '2026-10-21', title: 'Fall break', confidence: 'high', include: true }],
    }
    render(<ReviewTable course={ranged} dispatch={dispatch} />)
    expect((screen.getByLabelText('Last day') as HTMLInputElement).value).toBe('2026-10-21')
    fireEvent.click(screen.getByRole('button', { name: /runs to 2026-10-21/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'updateEvent', courseId: 'c1', eventId: 'e1', patch: { endDate: undefined } })
  })

  it("a range's last day can be moved", () => {
    const dispatch = vi.fn()
    const ranged: Course = {
      ...course,
      events: [{ id: 'e1', date: '2026-10-20', endDate: '2026-10-21', title: 'Fall break', confidence: 'high', include: true }],
    }
    render(<ReviewTable course={ranged} dispatch={dispatch} />)
    fireEvent.change(screen.getByLabelText('Last day'), { target: { value: '2026-10-23' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'updateEvent', courseId: 'c1', eventId: 'e1', patch: { endDate: '2026-10-23' } })
  })

  it('a single-day row can be given an end date, which starts the day after', () => {
    const dispatch = vi.fn()
    render(<ReviewTable course={course} dispatch={dispatch} />)
    expect(screen.queryByLabelText('Last day')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /run over more than one day/i }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'updateEvent', patch: { endDate: '2026-09-15' } }))
  })

  it('a row with no date yet is not offered an end date', () => {
    const blank: Course = { ...course, events: [{ id: 'e1', date: '', title: '', confidence: 'high', include: true }] }
    render(<ReviewTable course={blank} dispatch={() => {}} />)
    expect(screen.queryByRole('button', { name: /run over more than one day/i })).toBeNull()
  })

  it('unchecking include dispatches include false', () => {
    const dispatch = vi.fn()
    render(<ReviewTable course={course} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'updateEvent', patch: { include: false } }))
  })
})
