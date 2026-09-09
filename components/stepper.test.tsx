// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Stepper } from './stepper'

afterEach(cleanup)

describe('Stepper', () => {
  it('marks the current step, shows a check on done steps, and only lets you jump to done or earlier steps', () => {
    const onGo = vi.fn()
    render(<Stepper current={2} done={new Set([1])} onGo={onGo} />)
    const [s1, s2, s3] = screen.getAllByRole('button')
    expect(s2.getAttribute('aria-current')).toBe('step')
    expect(s1.querySelector('svg')).toBeTruthy()  // done steps show a tick, not their number
    expect(s1.textContent).not.toContain('1')
    fireEvent.click(s1)
    expect(onGo).toHaveBeenCalledWith(1)
    expect((s3 as HTMLButtonElement).disabled).toBe(true)
  })

  /**
   * The trail is navigation, and navigation that forgets where you have been is a dead end:
   * going back to the first screen from the last used to disable both the steps ahead of it.
   */
  it('lets you go forward to a step that is reachable but not yet done', () => {
    const onGo = vi.fn()
    render(<Stepper current={1} done={new Set([1])} reachable={new Set([2, 3] as const)} onGo={onGo} />)
    const [, s2, s3] = screen.getAllByRole('button')
    expect((s2 as HTMLButtonElement).disabled).toBe(false)
    expect((s3 as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(s3)
    expect(onGo).toHaveBeenCalledWith(3)
  })
})
