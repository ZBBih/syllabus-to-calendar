'use client'

import type { Step } from '@/lib/store'
import { Check } from './icons'

/** The landing page is step 0 and is not part of the progress trail, so it has no label. */
type FlowStep = Exclude<Step, 0>
const LABELS: Record<FlowStep, string> = { 1: 'Your classes', 2: 'Review', 3: 'Export' }

/**
 * `done` earns a step its tick. `reachable` is a separate question: a student who steps back
 * to the first screen has not undone the review, and the trail should still take them forward.
 */
export function Stepper({
  current,
  done,
  reachable,
  onGo,
}: {
  current: Step
  done: Set<Step>
  reachable?: ReadonlySet<Step>
  onGo: (s: Step) => void
}) {
  return (
    <ol className="flex items-center" aria-label="Progress">
      {([1, 2, 3] as FlowStep[]).map((s, i) => {
        const isDone = done.has(s)
        const isCurrent = s === current
        const clickable = isDone || s < current || reachable?.has(s) === true
        return (
          <li key={s} className="flex items-center">
            {i > 0 && <span className={`mx-2 h-px w-6 sm:w-9 ${isDone || isCurrent ? 'bg-accent' : 'bg-line-strong'}`} />}
            <button
              type="button"
              disabled={!clickable && !isCurrent}
              onClick={() => clickable && onGo(s)}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition ${
                isCurrent ? 'font-semibold text-fg' : clickable ? 'text-muted hover:text-fg' : 'text-muted/60'
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-full size-[1.375rem] text-[11px] font-semibold tabular-nums ${
                  isCurrent
                    ? 'bg-accent text-accent-ink'
                    : isDone
                      ? 'bg-accent-soft text-accent'
                      : 'border border-line-strong text-muted'
                }`}
              >
                {isDone && !isCurrent ? <Check size={12} /> : s}
              </span>
              <span className="hidden sm:inline">{LABELS[s]}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
