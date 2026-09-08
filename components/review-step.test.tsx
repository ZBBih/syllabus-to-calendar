// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReviewStep } from './review-step'
import type { State } from '@/lib/store'

afterEach(cleanup)

const state: State = {
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
      text: 'x',
      extracted: true,
      events: [
        { id: 'a', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true },
        { id: 'b', date: '2026-09-21', title: 'Essay', confidence: 'low', reason: 'date only', include: true },
      ],
    },
  ],
}

describe('ReviewStep', () => {
  it('select all / none dispatch setIncludeAll for the active course', () => {
    const dispatch = vi.fn()
    render(<ReviewStep state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /^none$/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setIncludeAll', courseId: 'c1', include: false })
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setIncludeAll', courseId: 'c1', include: true })
  })
  it('needs-check filter hides confident rows', () => {
    render(<ReviewStep state={state} dispatch={() => {}} />)
    expect(screen.getByDisplayValue('Quiz')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /needs check/i }))
    expect(screen.queryByDisplayValue('Quiz')).toBeNull()
    expect(screen.getByDisplayValue('Essay')).toBeTruthy()
  })
})

describe('ReviewStep selection controls', () => {
  it('lights All when every row is in, and None when none are', () => {
    const { rerender } = render(<ReviewStep state={state} dispatch={() => {}} />)
    expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /^none$/i }).getAttribute('aria-pressed')).toBe('false')

    const off: State = {
      ...state,
      courses: [{ ...state.courses[0], events: state.courses[0].events.map((e) => ({ ...e, include: false })) }],
    }
    rerender(<ReviewStep state={off} dispatch={() => {}} />)
    expect(screen.getByRole('button', { name: /^all$/i }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: /^none$/i }).getAttribute('aria-pressed')).toBe('true')
  })

  it('turning on Needs check drops the All highlight, and picking All turns the filter back off', () => {
    render(<ReviewStep state={state} dispatch={() => {}} />)
    const all = () => screen.getByRole('button', { name: /^all$/i })
    const filter = () => screen.getByRole('button', { name: /needs check/i })

    expect(all().getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(filter())
    expect(filter().getAttribute('aria-pressed')).toBe('true')
    expect(all().getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(all())
    expect(filter().getAttribute('aria-pressed')).toBe('false')
  })

  it('disables the filter when there is nothing to check', () => {
    const clean: State = {
      ...state,
      courses: [{ ...state.courses[0], events: state.courses[0].events.map((e) => ({ ...e, confidence: 'high' as const })) }],
    }
    render(<ReviewStep state={clean} dispatch={() => {}} />)
    expect((screen.getByRole('button', { name: /needs check/i }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('ReviewStep cross-class queue', () => {
  // Two classes, each holding one row that wants attention: an uncertain date in the first and
  // a row with no title in the second. Checking them is the job repeated once per class in the
  // one sitting a student does this, so the filter has to reach past the active tab.
  const two: State = {
    ...state,
    courses: [
      state.courses[0],
      {
        id: 'c2',
        name: 'CHEM 120',
        term: { season: 'Fall', year: 2026 },
        text: 'x',
        extracted: true,
        events: [
          { id: 'c', date: '2026-09-16', title: 'Lab report', confidence: 'high', include: true },
          { id: 'd', date: '2026-09-30', title: '', confidence: 'high', include: true },
        ],
      },
    ],
  }

  it('counts every class, not just the one on screen', () => {
    render(<ReviewStep state={two} dispatch={() => {}} />)
    expect(screen.getByRole('button', { name: /needs check \(2\)/i })).toBeTruthy()
  })

  it('shows the rows needing a check from every class at once, under their class names', () => {
    render(<ReviewStep state={two} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /needs check/i }))

    // The uncertain row from the active class and the untitled row from the other one are both
    // here; the two confident rows are not.
    expect(screen.getByDisplayValue('Essay')).toBeTruthy()
    expect(screen.queryByDisplayValue('Quiz')).toBeNull()
    expect(screen.queryByDisplayValue('Lab report')).toBeNull()
    expect(screen.getAllByLabelText('Date').map((i) => (i as HTMLInputElement).value)).toEqual(['2026-09-21', '2026-09-30'])

    // Each group is labelled, so a row fixed in the list is still attributable to a class.
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['ECON 101 1', 'CHEM 120 1'])
  })

  it('edits from the queue are dispatched against the class the row belongs to', () => {
    const dispatch = vi.fn()
    render(<ReviewStep state={two} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /needs check/i }))

    const titles = screen.getAllByLabelText('Title')
    fireEvent.change(titles[1], { target: { value: 'Midterm' } })
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ courseId: 'c2', eventId: 'd' }))
  })

  it('says so once the last row is fixed, rather than showing a blank table', () => {
    const { rerender } = render(<ReviewStep state={two} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /needs check/i }))
    expect(screen.queryByText(/nothing left to check/i)).toBeNull()

    // The student fixes both rows while the filter is still up: the list empties under them,
    // and an empty table would read as the app having lost their work.
    const fixed: State = {
      ...two,
      courses: two.courses.map((c) => ({
        ...c,
        events: c.events.map((e) => ({ ...e, title: e.title || 'Midterm', confidence: 'high' as const })),
      })),
    }
    rerender(<ReviewStep state={fixed} dispatch={() => {}} />)
    expect(screen.getByText(/nothing left to check/i)).toBeTruthy()
  })
})
