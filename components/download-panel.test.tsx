// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { DownloadPanel } from './download-panel'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course = (o: Partial<Course>): Course => ({
  id: 'c1',
  name: 'ECON 101',
  term: { season: 'Fall', year: 2026 },
  text: '',
  events: [{ id: 'e1', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true }],
  extracted: true,
  ...o,
})

describe('DownloadPanel gating', () => {
  it('disables download with no included events', () => {
    render(<DownloadPanel courses={[course({ events: [] })]} reminder="1d" dispatch={() => {}} />)
    expect((screen.getByRole('button', { name: /download calendar file/i }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/find and include some dates/i)).toBeTruthy()
  })

  it('disables download when a class with events has no name', () => {
    render(<DownloadPanel courses={[course({ name: '' })]} reminder="1d" dispatch={() => {}} />)
    expect((screen.getByRole('button', { name: /download calendar file/i }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/give every class a name/i)).toBeTruthy()
  })

  it('enables download and reports the count when ready', () => {
    render(<DownloadPanel courses={[course({})]} reminder="1d" dispatch={() => {}} />)
    expect((screen.getByRole('button', { name: /download calendar file/i }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText(/1 event ready/i)).toBeTruthy()
  })

  it('dispatches the reminder change', () => {
    const dispatch = vi.fn()
    render(<DownloadPanel courses={[course({})]} reminder="1d" dispatch={dispatch} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'none' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'setReminder', reminder: 'none' })
  })
})
