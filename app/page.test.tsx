// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import Home from './page'
import { STORAGE_KEY, type State } from '@/lib/store'

// jsdom ships no matchMedia, and the theme control reads it on first render.
window.matchMedia = ((q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const saved: State = {
  step: 2,
  reminder: '1d',
  activeCourseId: null,
  lastExport: [],
  exportSequence: 0,
  courses: [
    {
      id: 'c1',
      name: 'ECON 101',
      term: { season: 'Fall', year: 2026 },
      text: 'Quiz on Sept 14',
      extracted: true,
      events: [{ id: 'a', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true }],
      meeting: null,
      meetingIncluded: true,
      weights: [],
    },
  ],
}

describe('Home', () => {
  it('restores saved work on a reload instead of writing the empty start over it', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    // StrictMode's remount is what the browser reload does: load, save, load again.
    render(
      <StrictMode>
        <Home />
      </StrictMode>,
    )

    expect(await screen.findByDisplayValue('Quiz')).toBeTruthy()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.courses[0].events).toHaveLength(1)
    expect(stored.step).toBe(2)
  })
})
