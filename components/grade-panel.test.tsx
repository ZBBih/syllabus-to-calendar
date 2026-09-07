// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GradePanel } from './grade-panel'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course = (weights: Course['weights']): Course => ({
  id: 'c1',
  name: 'PSYC 101',
  term: { season: 'Fall', year: 2026 },
  text: 'x',
  events: [],
  extracted: true,
  weights,
})

const scored = [
  { id: 'w1', label: 'Midterm', weight: 40, earned: 90 },
  { id: 'w2', label: 'Final', weight: 60 },
]

describe('GradePanel', () => {
  it('stays shut, and summarises what it found before it is opened', () => {
    render(<GradePanel course={course([{ id: 'w1', label: 'Midterm', weight: 40 }])} dispatch={() => {}} />)
    expect(screen.getByText('1 categories found')).toBeTruthy()
    expect(screen.queryByLabelText('Category')).toBeNull()
  })

  it('says there is nothing yet when the syllabus had no table', () => {
    render(<GradePanel course={course([])} dispatch={() => {}} />)
    expect(screen.getByText('add your categories')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /grade/i }))
    expect(screen.getByText(/no grading table was found/i)).toBeTruthy()
  })

  it('shows the running grade in the header once a score is entered', () => {
    render(<GradePanel course={course(scored)} dispatch={() => {}} />)
    // 90% of the 40% that has been graded.
    expect(screen.getByText('90.0%')).toBeTruthy()
    expect(screen.getByText('A-')).toBeTruthy()
  })

  it('opens to the three cases: so far, best, and worst', () => {
    render(<GradePanel course={course(scored)} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /grade/i }))
    expect(screen.getByText('Grade so far')).toBeTruthy()
    // 90 on the midterm plus a perfect final, then the same midterm with nothing else.
    expect(screen.getByText('96.0%')).toBeTruthy()
    expect(screen.getByText('36.0%')).toBeTruthy()
  })

  it('warns when the weights do not add up to a hundred', () => {
    render(<GradePanel course={course([{ id: 'w1', label: 'Midterm', weight: 40 }])} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /grade/i }))
    expect(screen.getByText(/weights total 40%, which is not 100/i)).toBeTruthy()
  })

  it('adds, edits, and removes a category', () => {
    const dispatch = vi.fn()
    render(<GradePanel course={course(scored)} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /grade/i }))

    fireEvent.click(screen.getByRole('button', { name: /add category/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'addWeight', courseId: 'c1' })

    fireEvent.change(screen.getAllByLabelText('Weight percent')[0], { target: { value: '45' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'updateWeight', courseId: 'c1', weightId: 'w1', patch: { weight: 45 } })

    fireEvent.click(screen.getByRole('button', { name: /remove midterm/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'removeWeight', courseId: 'c1', weightId: 'w1' })
  })

  it('clearing a score sends undefined rather than zero, so it counts as ungraded', () => {
    const dispatch = vi.fn()
    render(<GradePanel course={course(scored)} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /grade/i }))
    fireEvent.change(screen.getAllByLabelText('Your score percent')[0], { target: { value: '' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'updateWeight', courseId: 'c1', weightId: 'w1', patch: { earned: undefined } })
  })
})
