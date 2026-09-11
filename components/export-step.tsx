'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type Dispatch } from 'react'
import { REMINDERS, type ExportedEntry, type Reminder } from '@/lib/ics'
import { reducer, type Action, type State } from '@/lib/store'
import { exportable, exportableCourses, fileNameFor, mergeHistory, planForAll, planForCourse, unnamedWithEvents } from '@/lib/export'
import { courseTag } from '@/lib/uid'
import { previewRows } from './date-preview'
import { Confetti } from './confetti'
import { ArtCrop } from './hero-art'
import { ArrowLeft, Check, Upload } from './icons'
import { SITE_URL } from '@/lib/site'

const GUIDES = {
  Google: [
    'On Android: tap "Add to my calendar", open the file from your notification or Files, and pick Google Calendar when asked. It adds every event.',
    'If your phone offers no app for the file, install a free .ics importer from the Play Store, or use the computer route below.',
    'On a computer: open calendar.google.com, click the gear icon, then Settings, then "Import & export".',
    'Choose syllabify.ics and pick which calendar to add to (make a "School" calendar first if you like), then click Import.',
    'Events sync to your phone automatically.',
  ],
  Apple: [
    'On a Mac: double-click syllabify.ics in Downloads, pick a calendar, click OK.',
    'To keep school separate, make a School calendar first with File > New Calendar.',
    'iCloud syncs it to every Apple device, so importing once on a Mac puts it on your phone too.',
    'On iPhone: tap "Add to my calendar" above, then "Save to Files". Open the Files app and tap syllabify.ics. If your phone offers to add the events, accept it.',
  ],
  Outlook: [
    'Outlook on the web: open the calendar, click "Add calendar", then "Upload from file".',
    'Pick syllabify.ics, choose which calendar to add to, click Import.',
    'Outlook desktop on Windows: File > Open & Export > Import/Export > "Import an iCalendar (.ics)".',
    'Outlook for Mac: File > Import and choose the file.',
  ],
} as const
/**
 * What an iPhone is actually told to do, kept apart from the Mac's steps.
 *
 * These are shown on the strength of the same check that picks the route, not on which guide tab
 * is open. A Mac lands on the Apple tab too, and if the check ever answered wrongly on a real
 * phone the student would be promised a screen they never see. This copy has shipped untrue
 * twice; it is not going to be able to do it again by disagreeing with the button beside it.
 */
const APPLE_PHONE_GUIDE = [
  'Tap "Add to my calendar" above. Your phone shows its own list of the dates with an "Add All" button at the top right.',
  'Tap "Add All". The button disappears once the dates are in, and that is the only confirmation your phone gives — it does not say anything or take you anywhere. Close the list with the check mark at the top left to come back here.',
  'Nothing gets saved to Files and nothing else has to be installed. If you want the file itself as well, use "Or send the file somewhere else" under the button.',
  'On a Mac instead: double-click syllabify.ics in Downloads, pick a calendar, click OK. iCloud syncs it to your phone.',
]

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
const onApplePhone = () => isAppleMobile(navigator.userAgent, navigator.maxTouchPoints ?? 0)

/**
 * An iPhone or iPad, as opposed to a Mac.
 *
 * These are the devices where handing the file to another app is a dead end: Calendar is not in
 * the share sheet, and whichever app has claimed .ics gets it instead. Navigating to the file
 * rather than sharing it gets Apple's own import screen, so they take a different route. iPadOS
 * reports itself as a Mac, and the touch points are the only thing that gives it away.
 */
export function isAppleMobile(ua: string, touchPoints = 0): boolean {
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return /Macintosh/i.test(ua) && touchPoints > 1
}

/**
 * Assigning location is what was verified on a real iPhone to produce the import screen, so it
 * is what ships. This indirection exists only so tests can watch it; jsdom cannot follow a
 * navigation, and an anchor click is a different enough mechanism that it would need retesting.
 */
export const nav = {
  go(url: string) {
    window.location.href = url
  },
}

/**
 * Hand the calendar file to the operating system as a page rather than as a download.
 *
 * The bytes are identical either way. What differs is how they arrive: Safari shows its own
 * event list with an Add All button for a text/calendar navigation, and sends the same file to
 * the share sheet, where there is no calendar to pick, when it is shared or downloaded instead.
 * The URL is deliberately not revoked, because this document is about to be replaced by it.
 */
function openCalendarFile(ics: string) {
  nav.go(URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })))
}

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

export function ExportStep({
  state,
  dispatch,
  persistNow,
}: {
  state: State
  dispatch: Dispatch<Action>
  /** Write this state to storage now. The calendar preview replaces the page before a debounce would run. */
  persistNow?: (state: State) => void
}) {
  const [tab, setTab] = useState<Tab>(() => (typeof navigator === 'undefined' ? 'Google' : defaultTab(navigator.userAgent)))
  const [done, setDone] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [shared, setShared] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(0)
  const canShare = useSyncExternalStore(noop, canShareFiles, () => false)
  const appleMobile = useSyncExternalStore(noop, onApplePhone, () => false)
  const menuRef = useRef<HTMLDivElement>(null)

  // This is the last screen before a student leaves, so a menu that cannot be put away is the
  // final impression the app makes. Escape closes it, matching the paste sheet and the read
  // report, and so does a tap anywhere outside it — the phone half of the audience has no key.
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    const onDown = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [menu])

  const courses = exportableCourses(state.courses)
  const plan = planForAll(courses, state)
  const included = plan.entries.length
  // The file also carries one repeating entry per class that has a weekly meeting time, and
  // those are not rows on the review table. Counting them as "deadlines" would contradict the
  // number the student just read there, so they are named separately.
  const meetings = courses.filter((c) => exportable(c).meeting).length
  const deadlines = included - meetings
  const ready = included > 0
  /**
   * Nothing ticked, but an earlier export put events on the calendar.
   *
   * Unticking everything is how a student says "take it all back off", and the file that does
   * it is the one this screen already builds: a plan with no events is a plan made entirely of
   * cancellations. Refusing to export it was the one case where the app could put events on a
   * calendar and not take them off again. Because a calendar identity is a content hash, this
   * works even for an import made from another browser, where no history is stored here.
   */
  const withdrawing = !ready && plan.cancelled > 0
  const canAct = ready || withdrawing
  const unnamed = unnamedWithEvents(state.courses)
  const clashDays = new Set(previewRows(state.courses).filter((r) => r.clash).map((r) => r.date)).size
  const repeat = state.exportSequence > 0

  /**
   * Record what just went onto the calendar, and commit it immediately.
   *
   * The write is normally debounced, which is right for typing but wrong here: on an iPhone the
   * calendar preview replaces this page within the same tick, and a pending write that never
   * lands would leave the next export unable to withdraw anything.
   */
  function record(entries: ExportedEntry[]) {
    dispatch({ type: 'recordExport', entries })
    persistNow?.(reducer(state, { type: 'recordExport', entries }))
  }

  function succeed(message: string) {
    record(plan.entries)
    setDone(message)
    setCelebrate((n) => n + 1)
  }

  function downloadAll() {
    saveFile(plan.ics, 'syllabify.ics')
    succeed(
      withdrawing
        ? 'syllabify.ics is in your Downloads. Open it the same way you imported, and your calendar drops those events.'
        : 'syllabify.ics is in your Downloads. One more step and your semester is on your calendar:',
    )
  }

  /**
   * The way out, and the shortest one each device has.
   *
   * On an iPhone or iPad that is a navigation to the file, which gets Apple's own event list
   * with an Add All button. The share sheet was the obvious route and is the wrong one: Calendar
   * is not in it, so the file goes to whichever app has claimed .ics and the student is stuck
   * looking at a preview with no way to accept it. Sharing stays available underneath, because
   * mailing the file to a computer is the escape hatch when anything else goes wrong.
   *
   * Everywhere else this is unchanged: the share sheet where a file can be shared, a download
   * otherwise. Android hands the file to Google Calendar perfectly well already.
   */
  async function addToCalendar() {
    if (appleMobile) {
      record(plan.entries)
      // Set before leaving so that a phone which restores this page from its back-forward cache
      // brings the student back to the finished screen rather than to the button again.
      // Deliberately short of claiming success. The import screen is Apple's, not ours: it reports
      // nothing back, so the app cannot tell Add All from a student who backed out. Saying every
      // date is on the calendar would be a lie half the time it was read.
      setDone(
        withdrawing
          ? 'Your phone has the list. If you tapped Add All, those events are off your calendar now.'
          : 'Your phone has the dates. If you tapped Add All, they are in your calendar with reminders set.',
      )
      setCelebrate((n) => n + 1)
      openCalendarFile(plan.ics)
      return
    }
    if (!canShare) {
      downloadAll()
      return
    }
    const file = new File([plan.ics], 'syllabify.ics', { type: 'text/calendar' })
    try {
      await navigator.share({ files: [file], title: withdrawing ? 'Class deadlines to remove' : 'My class deadlines' })
      succeed(
        withdrawing
          ? 'Save it to Files and open it the same way you imported. Your calendar drops those events.'
          : 'Choose "Save to Files", then open the file from Files. Calendar is not in the share sheet itself, so saving it first is the only route.',
      )
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      downloadAll()
    }
  }

  /**
   * The link, not the file. This is the moment the student has just seen it work, and it is the
   * only place the app ever asks for anything: a share sheet where there is one, the clipboard
   * everywhere else, and a plain instruction if the browser refuses both.
   */
  /**
   * The escape hatch on an iPhone: hand the file to another app after all.
   *
   * Calendar is not in that sheet, so this is not the way onto the calendar. It is the way to
   * Mail or Files, which is what a student needs when they are going to import on a computer
   * instead, and it is the only route left if Apple ever stops offering the import screen.
   */
  async function shareFile() {
    const file = new File([plan.ics], 'syllabify.ics', { type: 'text/calendar' })
    try {
      await navigator.share({ files: [file], title: withdrawing ? 'Class deadlines to remove' : 'My class deadlines' })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      downloadAll()
    }
  }

  async function shareSite() {
    // The sentence carries the link rather than sitting beside it: a share with both a text and
    // a url loses the text in Messages on iOS, and a bare link says nothing about what it is.
    const text = `Syllabify put my whole semester on my calendar in about a minute. No account, free. ${SITE_URL}`
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Syllabify', text })
        return
      }
      await navigator.clipboard.writeText(SITE_URL)
      setShared('Link copied.')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setShared(SITE_URL)
    }
  }

  return (
    <div className="step-enter">
      <Confetti fireKey={celebrate} />

      <h1 className="h1">
        {done
          ? withdrawing
            ? 'Off your calendar.'
            : 'That is your whole semester.'
          : ready
            ? 'One file. Your whole semester.'
            : withdrawing
              ? 'Take it back off your calendar.'
              : 'Nothing to export yet.'}
      </h1>
      <p className="lede mt-2">
        {ready
          ? `${deadlines} deadline${deadlines === 1 ? '' : 's'}${meetings > 0 ? ' plus your weekly class time' : ''} across ${courses.length} class${courses.length === 1 ? '' : 'es'}, ready to go.`
          : withdrawing
            ? `Nothing is ticked, so this file takes back the ${plan.cancelled} event${plan.cancelled === 1 ? '' : 's'} these classes put on your calendar.`
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
              <p className="h3 mt-4">Done.</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">{done}</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={addToCalendar} disabled={!canAct} className="btn btn-secondary">
                  Do that again
                </button>
                <button type="button" onClick={shareSite} className="btn btn-secondary">
                  Send this to a friend
                </button>
              </div>
              {shared && (
                <p role="status" className="mt-2 text-xs text-muted">
                  {shared}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="h2">
                {withdrawing ? (
                  <>
                    <span className="tabular-nums text-accent">{plan.cancelled}</span> event{plan.cancelled === 1 ? '' : 's'} to take back
                  </>
                ) : (
                  <>
                    <span className="tabular-nums text-accent">{deadlines}</span> deadline{deadlines === 1 ? '' : 's'}, one tap away
                  </>
                )}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                {withdrawing ? (
                  'This file tells your calendar to drop what the last export put there. Tick a row again if you only meant to remove some of them.'
                ) : (
                  <>
                    Grab the file, open it, and every date above lands in your calendar with a reminder attached.
                    {meetings > 0 && ' Your weekly class time comes along too.'}
                  </>
                )}
              </p>
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <button type="button" onClick={addToCalendar} disabled={!canAct} className="btn btn-primary btn-hero w-full sm:w-auto">
                  <Upload size={18} /> {withdrawing ? 'Take them off my calendar' : 'Add to my calendar'}
                </button>
                <p className="max-w-sm text-xs leading-relaxed text-muted">
                  {withdrawing
                    ? appleMobile
                      ? 'Opens your phone\u2019s own list. Tap Add All at the top, then close the list with the check mark.'
                      : canShare
                        ? 'Opens your share sheet. Save it to Files, then open it the same way you imported.'
                        : 'Saves one file. Opening it clears those events from your calendar.'
                    : appleMobile
                      ? 'Opens your phone\u2019s own list of the dates. Tap Add All at the top, then close the list with the check mark.'
                      : canShare
                        ? 'Opens your share sheet. Save it to Files, then open it to add every date.'
                        : 'Saves one file. Opening it imports every date at once.'}
                </p>
                {appleMobile && canShare && (
                  <button type="button" onClick={shareFile} disabled={!canAct} className="link text-xs">
                    Or send the file somewhere else
                  </button>
                )}
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

          <div ref={menuRef} className={`relative ml-auto ${courses.length < 2 ? 'hidden' : ''}`}>
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
                        record(mergeHistory(state.lastExport, one.entries, courseTag(c.name)))
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
                {plan.cancelled} event{plan.cancelled === 1 ? '' : 's'} you have since removed will be marked cancelled. Apple Calendar strikes those through
                and leaves them in place rather than deleting them, so remove any you no longer want to see; other apps vary, and some drop them outright.
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
          {(tab === 'Apple' && appleMobile ? APPLE_PHONE_GUIDE : GUIDES[tab]).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="card-sunk mt-4 p-3 text-xs text-muted">
          Import into a separate School calendar so you can colour it, hide it over break, and re-import a corrected file without touching anything else.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
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
