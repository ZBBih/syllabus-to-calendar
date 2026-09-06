// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ExportStep, defaultTab } from './export-step'
import type { State } from '@/lib/store'

afterEach(cleanup)

const base: State = {
  step: 3,
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
        { id: 'b', date: '2026-09-14', title: 'Essay', confidence: 'high', include: true },
      ],
    },
    {
      id: 'c2',
      name: '',
      term: { season: 'Fall', year: 2026 },
      text: 'x',
      extracted: true,
      events: [{ id: 'z', date: '2026-10-01', title: 'Lab', confidence: 'high', include: true }],
    },
  ],
}

describe('defaultTab', () => {
  it('picks Apple on iPhone and Mac, Google elsewhere', () => {
    expect(defaultTab('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('Apple')
    expect(defaultTab('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('Apple')
    expect(defaultTab('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('Google')
    expect(defaultTab('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Google')
  })
})

describe('ExportStep', () => {
  it('warns about unnamed classes with dates and offers a way back', () => {
    const dispatch = vi.fn()
    render(<ExportStep state={base} dispatch={dispatch} />)
    expect(screen.getByRole('alert').textContent).toMatch(/one class has no name/i)
    fireEvent.click(screen.getByRole('button', { name: /name it in upload/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStep', step: 1 })
  })
  it('shows a clash callout when two things share a day', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    expect(screen.getByText(/one day/i)).toBeTruthy()
  })
  it('counts only named classes in the summary and enables download', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    expect(screen.getByText(/2 events across 1 class,/i)).toBeTruthy()
    expect((screen.getByRole('button', { name: /download all/i }) as HTMLButtonElement).disabled).toBe(false)
  })
  it('downloads one class from the menu using a slug file name', () => {
    const state: State = { ...base, courses: [base.courses[0], { ...base.courses[1], name: 'PSYC 200' }] }
    const create = vi.fn(() => 'blob:x')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    render(<ExportStep state={state} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /one class only/i }))
    fireEvent.click(screen.getByRole('button', { name: 'PSYC 200' }))
    expect(create).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/saved psyc-200\.ics/i)).toBeTruthy()
  })
})
