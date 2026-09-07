// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PasteSheet } from './paste-sheet'
import type { Course } from '@/lib/store'

afterEach(cleanup)

describe('PasteSheet', () => {
  it('adds a new class from pasted text and closes', () => {
    const dispatch = vi.fn()
    const onClose = vi.fn()
    render(<PasteSheet course={null} dispatch={dispatch} onClose={onClose} />)
    const add = screen.getByRole('button', { name: /add class/i }) as HTMLButtonElement
    expect(add.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Class name'), { target: { value: 'ECON 101' } })
    fireEvent.change(screen.getByPlaceholderText(/paste the syllabus/i), { target: { value: 'Sept 14: Quiz' } })
    expect(add.disabled).toBe(false)
    fireEvent.click(add)
    expect(dispatch).toHaveBeenCalledWith({ type: 'addFromFiles', files: [{ name: 'ECON 101', text: 'Sept 14: Quiz', viaPhoto: false }] })
    expect(onClose).toHaveBeenCalled()
  })
  it('edits an existing class and merges a re-run', () => {
    const course: Course = { id: 'c1', name: 'ECON 101', term: { season: 'Fall', year: 2026 }, text: 'old', events: [], extracted: true }
    const dispatch = vi.fn()
    render(<PasteSheet course={course} dispatch={dispatch} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/paste the syllabus/i), { target: { value: 'Sept 14: Quiz' } })
    fireEvent.click(screen.getByRole('button', { name: /save and re-run/i }))
    const types = dispatch.mock.calls.map(([a]) => a.type)
    expect(types).toEqual(['update', 'mergeEvents'])
  })
  it('fills the name and the term from the pasted syllabus, so nothing has to be typed', () => {
    const dispatch = vi.fn()
    render(<PasteSheet course={null} dispatch={dispatch} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/paste the syllabus/i), {
      target: { value: 'PSYC 101: Introduction to Psychology\nSpring 2027\nFeb 2: Problem set 1' },
    })
    expect((screen.getByLabelText('Class name') as HTMLInputElement).value).toBe('PSYC 101')
    expect((screen.getByLabelText('Term') as HTMLSelectElement).value).toBe('Spring')
    expect((screen.getByLabelText('Year') as HTMLSelectElement).value).toBe('2027')
    expect((screen.getByRole('button', { name: /add class/i }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('never overwrites a name or a term the student set themselves', () => {
    render(<PasteSheet course={null} dispatch={vi.fn()} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Class name'), { target: { value: 'My psych class' } })
    fireEvent.change(screen.getByLabelText('Term'), { target: { value: 'Winter' } })
    fireEvent.change(screen.getByPlaceholderText(/paste the syllabus/i), {
      target: { value: 'PSYC 101: Introduction to Psychology\nSpring 2027' },
    })
    expect((screen.getByLabelText('Class name') as HTMLInputElement).value).toBe('My psych class')
    expect((screen.getByLabelText('Term') as HTMLSelectElement).value).toBe('Winter')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<PasteSheet course={null} dispatch={() => {}} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
