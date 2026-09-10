// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Landing } from './landing'
import { SAMPLE_NAME, SAMPLE_TEXT } from '@/lib/sample'

beforeEach(() => {
  // The demonstration under the hero plays on a timer. Hold it still so a click is a click.
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Landing', () => {
  it('sends a visitor with syllabi in hand straight to the upload step', () => {
    const dispatch = vi.fn()
    render(<Landing dispatch={dispatch} />)
    fireEvent.click(screen.getAllByRole('button', { name: /add my syllabi/i })[0])
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStep', step: 1 })
  })

  it('loads the real sample and lands on the review step, not the upload step', () => {
    const dispatch = vi.fn()
    render(<Landing dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /see it on a sample/i }))

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: 'addFromFiles',
      files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT, viaPhoto: false }],
    })
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'setStep', step: 2 })
  })

  it('offers the same sample from inside the demonstration', () => {
    const dispatch = vi.fn()
    render(<Landing dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /try it on a sample/i }))

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: 'addFromFiles',
      files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT, viaPhoto: false }],
    })
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'setStep', step: 2 })
  })

  it('carries the demonstration, so the page shows the reader rather than only describing it', () => {
    render(<Landing dispatch={() => {}} />)
    expect(screen.getByRole('list', { name: /what it found/i })).toBeTruthy()
  })

  it('never reaches for the calendar step from the front page', () => {
    const dispatch = vi.fn()
    render(<Landing dispatch={dispatch} />)
    for (const b of screen.getAllByRole('button')) fireEvent.click(b)
    const steps = dispatch.mock.calls.map(([a]) => a).filter((a) => a.type === 'setStep')
    expect(steps.every((a) => a.step === 1 || a.step === 2)).toBe(true)
  })
})
