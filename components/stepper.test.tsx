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
    expect(s1.textContent).toContain('✓')
    fireEvent.click(s1)
    expect(onGo).toHaveBeenCalledWith(1)
    expect((s3 as HTMLButtonElement).disabled).toBe(true)
  })
})
