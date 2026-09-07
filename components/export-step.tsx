'use client'

import { useState, useSyncExternalStore, type Dispatch } from 'react'
import { REMINDERS, type Reminder } from '@/lib/ics'
import type { Action, State } from '@/lib/store'
import { exportable, exportableCourses, fileNameFor, mergeHistory, planForAll, planForCourse, unnamedWithEvents } from '@/lib/export'
import { previewRows } from './date-preview'
import { Confetti } from './confetti'
import { ArtCrop } from './hero-art'
import { ArrowLeft, Check, Upload } from './icons'

const GUIDES = {
  Google: [
    'On Android: tap "Add to my calendar", open the file from your notification or Files, and pick Google Calendar when asked. It adds every event.',
    'If your phone offers no app for the file, install a free .ics importer from the Play Store, or use the computer route below.',
    'On a computer: open calendar.google.com, click the gear icon, then Settings, then "Import & export".',
    'Choose syllabify.ics and pick which calendar to add to (make a "School" calendar first if you like), then click Import.',
    'Events sync to your phone automatically.',
  ],
  Apple: [
    'On iPhone: tap "Add to my calendar" above, choose Calendar in the share sheet, then tap Add All.',
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
  const [celebrate, setCelebrate] = useState(0)
  const canShare = useSyncExternalStore(noop, canShareFiles, () => false)

  const courses = exportableCourses(state.courses)
  const plan = planForAll(courses, state)
  const included = plan.entries.length
  // The file also carries one repeating entry per class that has a weekly meeting time, and
  // those are not rows on the review table. Counting them as "deadlines" would contradict the
  // number the student just read there, so they are named separately.
  const meetings = courses.filter((c) => exportable(c).meeting).length
  const deadlines = included - meetings
  const ready = included > 0
  const unnamed = unnamedWithEvents(state.courses)
  const clashDays = new Set(previewRows(state.courses).filter((r) => r.clash).map((r) => r.date)).size
  const repeat = state.exportSequence > 0

  function succeed(message: string) {
    dispatch({ type: 'recordExport', entries: plan.entries })
    setDone(message)
    setCelebrate((n) => n + 1)
  }

  function downloadAll() {
    saveFile(plan.ics, 'syllabify.ics')
    succeed('syllabify.ics is in your Downloads. One more step and your semester is on your calendar:')
  }

  /**
   * The single way out. On a phone that can hand a file to another app this opens the share
   * sheet, which is by far the shortest route to Calendar; everywhere else it saves the file.
   * If the share sheet is dismissed we leave the student where they were rather than dumping
   * a download they did not ask for.
   */
  async function addToCalendar() {
    if (!canShare) {
      downloadAll()
      return
    }
    const file = new File([plan.ics], 'syllabify.ics', { type: 'text/calendar' })
    try {
      await navigator.share({ files: [file], title: 'My class deadlines' })
      succeed('Pick your Calendar app in the share sheet and tap Add All.')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      downloadAll()
    }
  }

  return (
    <div className="step-enter">
      <Confetti fireKey={celebrate} />

      <h1 className="h1">
        {done ? 'That is your whole semester.' : ready ? 'One file. Your whole semester.' : 'Nothing to export yet.'}
      </h1>
      <p className="lede mt-2">
        {ready
          ? `${deadlines} deadline${deadlines === 1 ? '' : 's'}${meetings > 0 ? ' plus your weekly class time' : ''} across ${courses.length} class${courses.length === 1 ? '' : 'es'}, ready to go.`
          : 'Go back and add a syllabus first.'}
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

      {/* The whole screen exists to get this pressed, so it gets the space and the weight. */}
      <div className="card pop-in mt-6 overflow-hidden">
        <div className="border-b border-line bg-accent-soft/60 px-5 py-7 text-center sm:px-8 sm:py-9">
          {done ? (
            <>
              <div className="pop-in relative mx-auto w-fit">
                <ArtCrop part="calendar" size={148} className="crop-in" />
                <span className="ring-once absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink">
                  <span className="draw-check">
                    <Check size={20} />
                  </span>
                </span>
              </div>
              <p className="mt-4 font-display text-2xl">Done.</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">{done}</p>
              <div className="mt-5">
                <button type="button" onClick={addToCalendar} disabled={!ready} className="btn btn-secondary">
                  Do that again
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-3xl sm:text-4xl">
                <span className="tabular-nums text-accent">{deadlines}</span> deadline{deadlines === 1 ? '' : 's'}, one tap away
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Grab the file, open it, and every date above lands in your calendar with a reminder attached.
                {meetings > 0 && ' Your weekly class time comes along too.'}
              </p>
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <button type="button" onClick={addToCalendar} disabled={!ready} className="btn btn-primary btn-hero w-full sm:w-auto">
                  <Upload size={18} /> Add to my calendar
                </button>
                <p className="max-w-sm text-xs leading-relaxed text-muted">
                  {canShare ? 'Opens your share sheet. Pick Calendar and tap Add All.' : 'Saves one file. Opening it imports every date at once.'}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
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

          <div className={`relative ml-auto ${courses.length < 2 ? 'hidden' : ''}`}>
            <button type="button" disabled={!ready} onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="btn btn-secondary btn-sm">
              Just one class
            </button>
            {menu && (
              <ul className="card pop-in absolute right-0 z-10 mt-1.5 min-w-48 overflow-hidden p-1">
                {courses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const one = planForCourse(c, state)
                        saveFile(one.ics, fileNameFor(c))
                        dispatch({ type: 'recordExport', entries: mergeHistory(state.lastExport, one.entries) })
                        setMenu(false)
                        setDone(`${fileNameFor(c)} is in your Downloads.`)
                        setCelebrate((n) => n + 1)
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
      </div>

      {repeat && ready && !done && (
        <div className="note note-accent rise mt-4">
          <strong>This is an update, not a second copy.</strong> Every event keeps the identity it had last time, so importing again corrects your calendar in
          place.
          <ul className="mt-2 space-y-0.5 text-[13px] text-muted">
            <li>
              {plan.updated} event{plan.updated === 1 ? '' : 's'} already on your calendar will be corrected.
            </li>
            <li>
              {plan.created} new event{plan.created === 1 ? '' : 's'} will be added.
            </li>
            {plan.cancelled > 0 && (
              <li>
                {plan.cancelled} event{plan.cancelled === 1 ? '' : 's'} you have since removed will be withdrawn. Google and Apple honour this; a few smaller
                calendar apps ignore withdrawals and you would have to delete those by hand.
              </li>
            )}
          </ul>
        </div>
      )}

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
        <button type="button" onClick={() => dispatch({ type: 'clear' })} className="btn btn-ghost">
          Start over
        </button>
      </div>
    </div>
  )
}
