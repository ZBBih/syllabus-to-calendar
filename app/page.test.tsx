// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import Home from './page'
import { type State } from '@/lib/store'
import { STORAGE_KEY } from '@/lib/persist'

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

/**
 * Starting over deliberately keeps enough to correct the calendar it already wrote to. A
 * student on a library or a roommate's machine wants the other thing, and until now the app
 * offered no way to do it at all — they had to know to clear site data in browser settings.
 */
describe('erasing everything on this device', () => {
  it('is offered once there is saved work', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    render(<Home />)
    expect(await screen.findByRole('button', { name: /erase everything on this device/i })).toBeTruthy()
  })

  it('is not offered when there is nothing to erase', async () => {
    render(<Home />)
    await screen.findByRole('button', { name: /syllabify home/i })
    expect(screen.queryByRole('button', { name: /erase everything on this device/i })).toBeNull()
  })

  it('asks before it erases, rather than going on the first tap', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    render(<Home />)

    fireEvent.click(await screen.findByRole('button', { name: /erase everything on this device/i }))

    expect(screen.getByRole('button', { name: /yes, erase everything/i })).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('removes the saved work from the browser when confirmed', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    render(<Home />)

    fireEvent.click(await screen.findByRole('button', { name: /erase everything on this device/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, erase everything/i }))

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.queryByDisplayValue('Quiz')).toBeNull()
  })

  it('can be backed out of without erasing', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    render(<Home />)

    fireEvent.click(await screen.findByRole('button', { name: /erase everything on this device/i }))
    fireEvent.click(screen.getByRole('button', { name: /keep my work/i }))

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(screen.getByRole('button', { name: /erase everything on this device/i })).toBeTruthy()
  })
})

/**
 * The app already runs with the network off — the worker caches the shell, the bundles and the
 * whole recogniser. Nothing said so, which wastes the strongest evidence there is for the
 * claim that nothing gets uploaded: the student can check it themselves.
 */
describe('the offline invitation', () => {
  const withController = (controller: unknown) => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller, register: () => Promise.resolve(), addEventListener: () => {}, removeEventListener: () => {} },
    })
  }

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker')
  })

  it('appears once the worker is in control', async () => {
    withController({})
    render(<Home />)
    expect(await screen.findByText(/airplane mode/i)).toBeTruthy()
  })

  it('stays quiet until the worker is actually in control', async () => {
    withController(null)
    render(<Home />)
    await screen.findByRole('button', { name: /syllabify home/i })
    expect(screen.queryByText(/airplane mode/i)).toBeNull()
  })
})
