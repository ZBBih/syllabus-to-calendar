'use client'

import { useSyncExternalStore } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'stc:theme'
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (readPref() === 'system') applyTheme('system')
    cb()
  }
  mq.addEventListener('change', onChange)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', onChange)
  }
}

const OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
]

export function ThemeControl() {
  const pref = useSyncExternalStore(subscribe, readPref, () => 'system' as ThemePref)

  function choose(next: ThemePref) {
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    applyTheme(next)
    notify()
  }

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-full border border-line bg-elev p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={pref === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => choose(o.value)}
          className={`flex h-8 w-9 items-center justify-center rounded-full transition ${
            pref === o.value ? 'bg-accent text-accent-ink shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}
