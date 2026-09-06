'use client'

import { useSyncExternalStore } from 'react'

const KEY = 'stc:theme'
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Dark if the user chose it, or if they have not chosen yet and the system prefers dark. */
function isDark(): boolean {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'dark') return true
    if (v === 'light') return false
  } catch {
    /* fall through */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    document.documentElement.classList.toggle('dark', isDark())
    cb()
  }
  mq.addEventListener('change', onChange)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', onChange)
  }
}

export function ThemeControl() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  function set(next: boolean) {
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle('dark', next)
    notify()
  }

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-lg border border-line bg-elev p-0.5">
      <button
        type="button"
        role="radio"
        aria-checked={!dark}
        aria-label="Light"
        title="Light"
        onClick={() => set(false)}
        className={`flex h-7 w-8 items-center justify-center rounded-md transition ${!dark ? 'bg-accent text-accent-ink' : 'text-muted hover:text-fg'}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={dark}
        aria-label="Dark"
        title="Dark"
        onClick={() => set(true)}
        className={`flex h-7 w-8 items-center justify-center rounded-md transition ${dark ? 'bg-accent text-accent-ink' : 'text-muted hover:text-fg'}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>
    </div>
  )
}
