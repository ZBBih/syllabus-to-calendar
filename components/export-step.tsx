'use client'

import { useState, useSyncExternalStore, type Dispatch } from 'react'
import { REMINDERS, type Reminder } from '@/lib/ics'
import type { Action, State } from '@/lib/store'
import { exportableCourses, fileNameFor, mergeHistory, planForAll, planForCourse, unnamedWithEvents } from '@/lib/export'
import { previewRows } from './date-preview'
import { ArrowLeft, Check } from './icons'

const GUIDES = {
  Google: [
    'On Android: tap "Download all", open the file from your notification or Files, and pick Google Calendar when asked. It adds every event.',
    'If your phone offers no app for the file, install a free .ics importer from the Play Store, or use the computer route below.',
    'On a computer: open calendar.google.com, click the gear icon, then Settings, then "Import & export".',
    'Choose syllabify.ics and pick which calendar to add to (make a "School" calendar first if you like), then click Import.',
    'Events sync to your phone automatically.',
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

export function defaultTab(ua: string): Tab {
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) return 'Apple'
  if (/Windows/i.test(ua) && /Outlook/i.test(ua)) return 'Outlook'
  return 'Google'
}

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
  const [tab, setTab] = useState<Tab>(() => (typeof navigator === 'undefined' ? 'Google' : defaultTab(navigator.userAgent)))
  const [done, setDone] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const canShare = useSyncExternalStore(noop, canShareFiles, () => false)

  const courses = exportableCourses(state.courses)
  const plan = planForAll(courses, state)
  const included = plan.entries.length
  const ready = included > 0
  const unnamed = unnamedWithEvents(state.courses)
  const clashDays = new Set(previewRows(state.courses).filter((r) => r.clash).map((r) => r.date)).size
  const repeat = state.exportSequence > 0

  async function share() {
    const file = new File([plan.ics], 'syllabify.ics', { type: 'text/calendar' })
    try {
      await navigator.share({ files: [file], title: 'My class deadlines' })
      dispatch({ type: 'recordExport', entries: plan.entries })
      setDone('Sent. Pick your Calendar app in the share sheet and tap Add All.')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      downloadAll()
    }
  }

  function downloadAll() {
    saveFile(plan.ics, 'syllabify.ics')
    dispatch({ type: 'recordExport', entries: plan.entries })
    setDone('Saved syllabify.ics to Downloads. Now add it to your calendar:')
  }

  return (
    <div className="step-enter">
      <h1 className="h1">Put it on your calendar</h1>
      <p className="lede mt-2">
        {ready
          ? `${included} event${included === 1 ? '' : 's'} across ${courses.length} class${courses.length === 1 ? '' : 'es'}, in one file.`
          : 'Nothing to export yet.'}
      </p>

      {unnamed.length > 0 && (
        <div role="alert" className="note note-warn rise mt-4">
          <strong>{unnamed.length === 1 ? 'One class has no name' : `${unnamed.length} classes have no name`}</strong> and will be left out of the file.{' '}
          <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="link">
            Name {unnamed.length === 1 ? 'it' : 'them'} in Upload
          </button>
          .
        </div>
      )}

      {clashDays > 0 && (
        <div className="note rise mt-4">
          <strong>{clashDays === 1 ? 'One day' : `${clashDays} days`} with two or more things due.</strong>{' '}
          <button type="button" onClick={() => dispatch({ type: 'setStep', step: 2 })} className="link">
            See them by date
          </button>{' '}
          before you import, in case something needs to move.
        </div>
      )}

      {repeat && ready && (
        <div className="note note-accent rise mt-4">
          <strong>This is an update, not a second copy.</strong> Every event keeps the identity it had last time, so importing again corrects your calendar in
          place.
          <ul className="mt-2 space-y-0.5 text-[13px] text-muted">
            <li>{plan.updated} event{plan.updated === 1 ? '' : 's'} already on your calendar will be corrected.</li>
            <li>{plan.created} new event{plan.created === 1 ? '' : 's'} will be added.</li>
            {plan.cancelled > 0 && (
              <li>
                {plan.cancelled} event{plan.cancelled === 1 ? '' : 's'} you have since removed will be withdrawn. Google and Apple honour this; a few smaller
                calendar apps ignore withdrawals and you would have to delete those by hand.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="card mt-6 p-5">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Remind me</span>
          <select
            value={state.reminder}
            onChange={(e) => dispatch({ type: 'setReminder', reminder: e.target.value as Reminder })}
            className="field w-auto py-1"
          >
            {REMINDERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
              One class only
            </button>
            {menu && (
              <ul className="card rise absolute left-0 z-10 mt-1.5 min-w-48 overflow-hidden p-1">
                {courses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const one = planForCourse(c, state)
                        saveFile(one.ics, fileNameFor(c))
                        dispatch({ type: 'recordExport', entries: mergeHistory(state.lastExport, one.entries) })
                        setMenu(false)
                        setDone(`Saved ${fileNameFor(c)} to Downloads.`)
                      }}
                      className="w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent-soft"
                    >
                      {c.name.trim()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {done && (
          <p className="rise mt-3 flex items-center gap-1.5 text-sm font-medium text-ok">
            <Check size={15} /> {done}
          </p>
        )}
        {canShare && <p className="mt-2 text-xs text-muted">On a phone, Send to my calendar opens the share sheet so you can add every event in one tap.</p>}
      </div>

      <div className="card mt-4 p-5">
        <div className="flex gap-1 border-b border-line">
          {(Object.keys(GUIDES) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
                tab === t ? 'border-accent font-semibold text-fg' : 'border-transparent text-muted hover:text-fg'
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
        <p className="card-sunk mt-4 p-3 text-xs text-muted">
          Import into a separate School calendar so you can colour it, hide it over break, and re-import a corrected file without touching anything else.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 2 })} className="btn btn-secondary">
          <ArrowLeft size={15} /> Back
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
