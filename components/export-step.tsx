'use client'

import { useState, useSyncExternalStore, type Dispatch } from 'react'
import { REMINDERS, type Reminder } from '@/lib/ics'
import type { Action, State } from '@/lib/store'
import { fileNameFor, icsForAll, icsForCourse } from '@/lib/export'

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

function saveFile(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ExportStep({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [tab, setTab] = useState<Tab>('Google')
  const [done, setDone] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const canShare = useSyncExternalStore(noop, canShareFiles, () => false)
  const courses = state.courses.filter((c) => c.name.trim() && c.events.some((e) => e.include !== false && e.date))
  const included = courses.reduce((n, c) => n + c.events.filter((e) => e.include !== false && e.date).length, 0)
  const ready = included > 0

  async function share() {
    const file = new File([icsForAll(courses, state.reminder)], 'syllabify.ics', { type: 'text/calendar' })
    try {
      await navigator.share({ files: [file], title: 'My class deadlines' })
      setDone('Sent! Pick your Calendar app in the share sheet and tap Add All.')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      downloadAll()
    }
  }
  function downloadAll() {
    saveFile(icsForAll(courses, state.reminder), 'syllabify.ics')
    setDone('Saved syllabify.ics to Downloads. Now add it to your calendar:')
  }

  return (
    <div className="step-enter">
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Put it on your calendar</h1>
      <p className="mt-2 text-muted">
        {ready ? `${included} event${included === 1 ? '' : 's'} across ${courses.length} class${courses.length === 1 ? '' : 'es'}, one file.` : 'Nothing to export yet.'}
      </p>

      <div className="card mt-6 p-5 sm:p-6">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Remind me</span>
          <select value={state.reminder} onChange={(e) => dispatch({ type: 'setReminder', reminder: e.target.value as Reminder })} className="field w-auto py-1.5">
            {REMINDERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canShare && (
            <button type="button" onClick={share} disabled={!ready} className="btn btn-primary">
              Send to my calendar
            </button>
          )}
          <button type="button" onClick={downloadAll} disabled={!ready} className={`btn ${canShare ? 'btn-secondary' : 'btn-primary'}`}>
            Download all
          </button>
          <div className="relative">
            <button type="button" disabled={!ready || courses.length < 2} onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="btn btn-secondary">
              Download one class ▾
            </button>
            {menu && (
              <ul className="card pop absolute left-0 z-10 mt-2 min-w-48 overflow-hidden p-1">
                {courses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        saveFile(icsForCourse(c, state.reminder), fileNameFor(c))
                        setMenu(false)
                        setDone(`Saved ${fileNameFor(c)} to Downloads.`)
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent-soft"
                    >
                      {c.name.trim()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {done && <p className="pop mt-3 text-sm font-semibold text-ok">{done}</p>}
        {canShare && <p className="mt-2 text-xs text-muted">On a phone, “Send to my calendar” opens the share sheet so you can add every event in one tap.</p>}
      </div>

      <div className="card mt-4 p-5 sm:p-6">
        <div className="flex gap-1 border-b border-line">
          {(Object.keys(GUIDES) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === t ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`}
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
        <p className="mt-4 rounded-xl bg-accent-soft/60 p-3 text-xs text-muted">Tip: import into a separate School calendar so you can colour it or hide it over break.</p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 2 })} className="btn btn-secondary">
          ← Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all classes and dates and start over?')) dispatch({ type: 'clear' })
          }}
          className="btn btn-ghost"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
