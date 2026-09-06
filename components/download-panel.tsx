'use client'

import { useState, useSyncExternalStore, type Dispatch } from 'react'
import { buildIcs, REMINDERS, type Reminder } from '@/lib/ics'
import type { Action, Course } from '@/lib/store'

const GUIDES = {
  Google: [
    'Open calendar.google.com on a computer (the phone app cannot import files).',
    'Optional but nice: next to "Other calendars" click + then "Create new calendar" and name it School.',
    'Click the gear icon, then Settings, then "Import & export".',
    'Choose syllabify.ics from your Downloads and pick the calendar to add to.',
    'Click Import. Events show up immediately and sync to your phone.',
  ],
  Apple: [
    'On iPhone: tap "Send to my calendar" above, choose Calendar in the share sheet, then tap Add All.',
    'On a Mac: double-click syllabify.ics in Downloads, pick a calendar, click OK.',
    'To keep school separate, make a School calendar first with File > New Calendar.',
    'iCloud syncs it to every Apple device.',
  ],
  Outlook: [
    'Outlook on the web: open the calendar, click "Add calendar", then "Upload from file".',
    'Pick syllabify.ics, choose which calendar to add to, click Import.',
    'Outlook desktop on Windows: File > Open & Export > Import/Export > "Import an iCalendar (.ics)".',
    'Outlook for Mac: File > Import and choose the file.',
  ],
} as const
type Tab = keyof typeof GUIDES

const canShareFiles = () => {
  try {
    const probe = new File(['x'], 'probe.ics', { type: 'text/calendar' })
    return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}
const noop = () => () => {}

export function DownloadPanel({ courses, reminder, dispatch }: { courses: Course[]; reminder: Reminder; dispatch: Dispatch<Action> }) {
  const [tab, setTab] = useState<Tab>('Google')
  const [done, setDone] = useState<'download' | 'share' | null>(null)
  const canShare = useSyncExternalStore(noop, canShareFiles, () => false)
  const included = courses.reduce((n, c) => n + c.events.filter((e) => e.include !== false && e.date).length, 0)
  const unnamed = courses.some((c) => c.events.some((e) => e.include !== false) && c.name.trim() === '')
  const canDownload = included > 0 && !unnamed

  function ics() {
    return buildIcs(
      courses.map((c) => ({ name: c.name.trim(), events: c.events.filter((e) => e.include !== false && e.date && e.title.trim()) })),
      reminder,
    )
  }

  async function share() {
    const file = new File([ics()], 'syllabify.ics', { type: 'text/calendar' })
    try {
      await navigator.share({ files: [file], title: 'My class deadlines' })
      setDone('share')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      download()
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([ics()], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'syllabify.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDone('download')
  }

  return (
    <div className="card rise p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        {canShare && (
          <button type="button" onClick={share} disabled={!canDownload} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 8l5-5 5 5" />
              <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
            Send to my calendar
          </button>
        )}
        <button type="button" onClick={download} disabled={!canDownload} className={`btn ${canShare ? 'btn-secondary' : 'btn-primary'}`}>
          Download calendar file
        </button>
        <span className="text-sm text-muted">
          {unnamed ? 'Give every class a name first.' : included === 0 ? 'Find and include some dates first.' : `${included} event${included === 1 ? '' : 's'} ready`}
        </span>
      </div>

      <label className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Remind me</span>
        <select value={reminder} onChange={(e) => dispatch({ type: 'setReminder', reminder: e.target.value as Reminder })} className="field w-auto py-1.5">
          {REMINDERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      {done === 'download' && <p className="pop mt-3 text-sm font-semibold text-ok">Saved to Downloads. Now add it to your calendar:</p>}
      {done === 'share' && <p className="pop mt-3 text-sm font-semibold text-ok">Sent! Pick your Calendar app in the share sheet and tap Add All.</p>}

      <div className="mt-5">
        <div className="flex gap-1 border-b border-line">
          {(Object.keys(GUIDES) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === t ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              {t === 'Apple' ? 'Apple Calendar' : t === 'Google' ? 'Google Calendar' : 'Outlook'}
            </button>
          ))}
        </div>
        <ol key={tab} className="stagger mt-4 list-decimal space-y-2 pl-5 text-sm">
          {GUIDES[tab].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-accent-soft/60 p-3 text-xs text-muted">
          Tip: import into a separate School calendar so you can colour it or hide it over break.
        </p>
      </div>
    </div>
  )
}
