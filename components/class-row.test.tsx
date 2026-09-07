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
    const { rerender } = render(<ClassRow course={course({})} index={0} dispatch={dispatch} onEditText={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /clear name/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'update', id: 'c1', patch: { name: '' } })
    rerender(<ClassRow course={course({ name: '' })} index={0} dispatch={dispatch} onEditText={() => {}} />)
    expect(screen.queryByRole('button', { name: /clear name/i })).toBeNull()
  })
  it('drops a class on the first click, with dates or without, and never asks', () => {
    const dispatch = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm')
    const { rerender } = render(<ClassRow course={course({})} index={0} dispatch={dispatch} onEditText={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'remove', id: 'c1' })

    dispatch.mockClear()
    rerender(<ClassRow course={{ ...course({}), events: [] }} index={0} dispatch={dispatch} onEditText={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'remove', id: 'c1' })

    expect(confirmSpy).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
  it('changing the term asks for a re-read, not a plain field update', () => {
    const dispatch = vi.fn()
    render(<ClassRow course={course({})} index={0} dispatch={dispatch} onEditText={() => {}} />)
    fireEvent.change(screen.getByLabelText('Term'), { target: { value: 'Spring' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTerm', id: 'c1', term: { season: 'Spring', year: 2026 } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2027' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTerm', id: 'c1', term: { season: 'Fall', year: 2027 } })
  })

  it('shows the date count pill', () => {
    render(<ClassRow course={course({})} index={0} dispatch={() => {}} onEditText={() => {}} />)
    expect(screen.getByText('1 date')).toBeTruthy()
  })
})
