// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReadReport } from './read-report'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course = (text: string): Course => ({
  id: 'c1',
  name: 'PSYC 101',
  term: { season: 'Fall', year: 2026 },
  text,
  events: [],
  extracted: true,
})

describe('ReadReport', () => {
  it('shows every line of the syllabus back, including the ones with no date', () => {
    render(<ReadReport course={course('Course schedule\nSept 14: Midterm 1')} dispatch={() => {}} onClose={() => {}} />)
    expect(screen.getByText('Course schedule')).toBeTruthy()
    expect(screen.getByText('Sept 14: Midterm 1')).toBeTruthy()
    expect(screen.getByText(/Taken as Midterm 1 on 2026-09-14/)).toBeTruthy()
  })

  it('names a date it left out and why', () => {
    render(<ReadReport course={course('May 4: Final exam')} dispatch={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/was left out: outside the term/)).toBeTruthy()
  })

  it('keeps a left-out date on one tap, with the line as its description', () => {
    const dispatch = vi.fn()
    render(<ReadReport course={course('May 4: Final exam')} dispatch={dispatch} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /keep 2027-05-04/i }))
    expect(dispatch).toHaveBeenCalledWith({
      type: 'addEvent',
      courseId: 'c1',
      preset: { date: '2027-05-04', title: 'Final exam', source: 'May 4: Final exam' },
    })
    expect(screen.getByText(/added to your dates/i)).toBeTruthy()
  })

  it('offers nothing to keep when every date was used', () => {
    render(<ReadReport course={course('Sept 14: Midterm 1')} dispatch={() => {}} onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /^keep/i })).toBeNull()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ReadReport course={course('Sept 14: Midterm 1')} dispatch={() => {}} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
