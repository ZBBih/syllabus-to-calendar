// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ClassRow } from './class-row'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course = (o: Partial<Course>): Course => ({
  id: 'c1',
  name: 'ECON 101',
  term: { season: 'Fall', year: 2026 },
  text: 'x',
  events: [{ id: 'e', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true }],
  extracted: true,
  ...o,
})

describe('ClassRow', () => {
  it('shows a clear button only when the name has text, and clearing dispatches an empty name', () => {
    const dispatch = vi.fn()
    const { rerender } = render(<ClassRow course={course({})} index={0} canRemove dispatch={dispatch} onEditText={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /clear name/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'update', id: 'c1', patch: { name: '' } })
    rerender(<ClassRow course={course({ name: '' })} index={0} canRemove dispatch={dispatch} onEditText={() => {}} />)
    expect(screen.queryByRole('button', { name: /clear name/i })).toBeNull()
  })
  it('shows the date count pill', () => {
    render(<ClassRow course={course({})} index={0} canRemove dispatch={() => {}} onEditText={() => {}} />)
    expect(screen.getByText('1 date')).toBeTruthy()
  })
})
