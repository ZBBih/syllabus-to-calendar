// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { CourseCard } from './course-card'
import type { Course } from '@/lib/store'

afterEach(cleanup)

const course = (o: Partial<Course>): Course => ({
  id: 'c1',
  name: '',
  term: { season: 'Fall', year: 2026 },
  text: '',
  events: [],
  extracted: false,
  ...o,
})

describe('CourseCard', () => {
  it('disables Find dates until name and text exist', () => {
    render(<CourseCard course={course({})} index={0} canRemove={false} dispatch={() => {}} />)
    expect((screen.getByRole('button', { name: /find dates/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('merges extracted events on Find dates and labels the button Re-run afterwards', () => {
    const dispatch = vi.fn()
    const { rerender } = render(
      <CourseCard course={course({ name: 'ECON 101', text: 'Sept 14: Quiz 1' })} index={0} canRemove={false} dispatch={dispatch} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /find dates/i }))
    const call = dispatch.mock.calls.find(([a]) => a.type === 'mergeEvents')?.[0]
    expect(call.events).toHaveLength(1)
    expect(call.events[0]).toMatchObject({ date: '2026-09-14', title: 'Quiz 1' })
    rerender(<CourseCard course={course({ name: 'ECON 101', text: 'x', extracted: true })} index={0} canRemove={false} dispatch={dispatch} />)
    expect(screen.getByRole('button', { name: /re-run/i })).toBeTruthy()
  })

  it('shows the heading as Class N plus the name', () => {
    render(<CourseCard course={course({ name: 'PSYC 200' })} index={1} canRemove dispatch={() => {}} />)
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Class 2PSYC 200')
  })
})
