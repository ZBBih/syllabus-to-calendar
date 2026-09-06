'use client'

import type { Step } from '@/lib/store'

const LABELS: Record<Step, string> = { 1: 'Upload', 2: 'Review', 3: 'Export' }

export function Stepper({ current, done, onGo }: { current: Step; done: Set<Step>; onGo: (s: Step) => void }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {([1, 2, 3] as Step[]).map((s, i) => {
        const isDone = done.has(s)
        const isCurrent = s === current
        const clickable = isDone || s < current
        return (
          <li key={s} className="flex items-center gap-2">
            {i > 0 && <span className={`h-px w-6 sm:w-10 ${isDone || isCurrent ? 'bg-accent' : 'bg-line'}`} />}
            <button
              type="button"
              disabled={!clickable && !isCurrent}
              onClick={() => clickable && onGo(s)}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold transition ${
                isCurrent ? 'bg-accent text-accent-ink' : clickable ? 'text-fg hover:bg-accent-soft' : 'text-muted'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                  isCurrent ? 'bg-accent-ink/15' : isDone ? 'bg-ok text-white' : 'bg-line'
                }`}
              >
                {isDone && !isCurrent ? '✓' : s}
              </span>
              <span className="hidden sm:inline">{LABELS[s]}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
