// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ChangeSummary } from './change-summary'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course = (from: string, to: string): Course => ({
  id: 'c1',
  name: 'PSYC 101',
  term: { season: 'Fall', year: 2027 },
  text: 'x',
  extracted: true,
  events: [{ id: 'e1', date: to, title: 'Final exam', confidence: 'high', include: true }],
  diff: { added: [], moved: [{ id: 'e1', from, to }], missing: [] },
})

describe('ChangeSummary', () => {
  it('leaves the year out of a move inside one term', () => {
    render(<ChangeSummary course={course('2026-12-16', '2026-12-18')} dispatch={() => {}} />)
    expect(screen.getByText(/moved from Dec 16 to Dec 18/)).toBeTruthy()
  })

  it('names the year when the move crosses one, so a corrected term does not read as a no-op', () => {
    render(<ChangeSummary course={course('2026-12-16', '2027-12-16')} dispatch={() => {}} />)
    expect(screen.getByText(/moved from Dec 16, 2026 to Dec 16, 2027/)).toBeTruthy()
  })
})
