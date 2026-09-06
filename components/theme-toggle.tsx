'use client'

import { useSyncExternalStore } from 'react'

const KEY = 'stc:theme'
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', cb)
  }
}
const getSnapshot = () => document.documentElement.classList.contains('dark')
const getServerSnapshot = () => false

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    notify()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="wiggle flex h-10 w-10 items-center justify-center rounded-full border border-line bg-elev text-fg transition hover:border-accent"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
