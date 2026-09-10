'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { extractEvents, readReport, type Term } from '@/lib/extract'
import { detectMeeting, DAY_LABEL } from '@/lib/meeting'
import { extractWeights } from '@/lib/grades'
import { SAMPLE_TEXT } from '@/lib/sample'
import { defaultTerm } from '@/lib/store'
import { termFromText } from '@/lib/term'
import { ArrowRight, Check } from './icons'

/**
 * The landing page arguing by demonstration instead of by claim.
 *
 * Everything above this on the page is an assertion: nothing is uploaded, no account, every date
 * pulled out. A visitor deciding whether to hand over their semester has no way to check any of
 * it without first pressing a button that takes them off the page. So this runs the real
 * extractor over the real sample text, in their browser, at reading speed: the syllabus arrives
 * a line at a time on the left and the dates land on the right as the same pass finds them.
 *
 * It imports `extractEvents` and `readReport` rather than a copy of their output, which is the
 * whole point. A hand-written demo would be a drawing of the product and would drift away from
 * it the first time extraction changed. This cannot: if the parser stops finding the midterm,
 * the front page stops showing the midterm.
 */

/** The term the app itself would choose for this text, by the same rule the intake path uses. */
export const DEMO_TERM: Term = termFromText(SAMPLE_TEXT) ?? defaultTerm()

/** Milliseconds a line holds before the next one arrives. Reading speed, not machine speed. */
const STEP = 190

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** ISO to something a student reads, without asking the browser's locale what it thinks. */
function dayLabel(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`
}

function dateLabel(date: string, endDate?: string): string {
  if (!endDate) return dayLabel(date)
  const sameMonth = date.slice(0, 7) === endDate.slice(0, 7)
  return sameMonth ? `${dayLabel(date)}–${Number(endDate.slice(8))}` : `${dayLabel(date)} – ${dayLabel(endDate)}`
}

function timeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

type Row = {
  key: string
  /** Index of the syllabus line this came off, so a row cannot appear before its own line. */
  line: number
  date: string
  endDate?: string
  time?: string
  title: string
  /** Amber in the app means "look at this one". The demo tells the same truth. */
  uncertain: boolean
}

function build() {
  const lines = readReport(SAMPLE_TEXT, DEMO_TERM)
  const events = extractEvents(SAMPLE_TEXT, DEMO_TERM)
  const certainty = new Map(events.map((e) => [`${e.date}|${e.title.toLowerCase()}`, e.confidence]))
  const rows: Row[] = lines.flatMap((l, line) =>
    l.captured.map((c, n) => ({
      key: `${line}-${n}`,
      line,
      date: c.date,
      endDate: c.endDate,
      time: c.time,
      title: c.title,
      uncertain: certainty.get(`${c.date}|${c.title.toLowerCase()}`) === 'low',
    })),
  )
  return {
    text: lines.map((l) => l.text),
    rows,
    meeting: detectMeeting(SAMPLE_TEXT, DEMO_TERM),
    weights: extractWeights(SAMPLE_TEXT),
  }
}

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeMotion(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(MOTION_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const motionNow = () => typeof window.matchMedia === 'function' && window.matchMedia(MOTION_QUERY).matches
const motionOnServer = () => false

export function ExtractDemo({ onSample }: { onSample?: () => void }) {
  const { text, rows, meeting, weights } = useMemo(() => build(), [])
  // Playback starts at nothing on both the server and the first client render, so hydration has
  // nothing to disagree about. The app needs JavaScript to do anything at all, so a panel that
  // is empty without it is telling the truth about the page it sits on.
  const [shown, setShown] = useState(0)
  const [seen, setSeen] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const rowScroller = useRef<HTMLDivElement>(null)

  // Asked as a question every render rather than answered once into state, so the panel follows
  // the setting if it changes and nothing has to be written from inside an effect.
  const reduced = useSyncExternalStore(subscribeMotion, motionNow, motionOnServer)
  // Nobody should arrive at a demonstration that already finished while it was off screen. Where
  // there is no way to tell whether it is on screen, assume it is rather than never playing.
  const unobservable = useMemo(() => typeof IntersectionObserver === 'undefined', [])
  const playing = (seen || unobservable) && !reduced
  const done = reduced || shown >= text.length

  useEffect(() => {
    const el = scroller.current
    if (!el || unobservable || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [unobservable, seen])

  useEffect(() => {
    if (!playing || done) return
    const id = setInterval(() => setShown((s) => (s >= text.length ? s : s + 1)), STEP)
    return () => clearInterval(id)
  }, [playing, done, text.length])

  // Both columns follow the newest thing in them, so nothing lands out of sight.
  useEffect(() => {
    for (const el of [scroller.current, rowScroller.current]) {
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [shown])

  const replay = () => setShown(0)

  const lines = reduced ? text : text.slice(0, shown)
  const visible = reduced ? rows : rows.filter((r) => r.line < shown)
  const term = `${DEMO_TERM.season} ${DEMO_TERM.year}`
  const meetingLine = meeting
    ? `${meeting.days.map((d) => DAY_LABEL[d]).join(', ')} · ${meeting.start}–${meeting.end}${meeting.location ? ` · ${meeting.location}` : ''}`
    : null

  return (
    <section aria-labelledby="demo-heading">
      <h2 id="demo-heading" className="text-center font-display text-3xl sm:text-4xl">
        Watch it read one
      </h2>
      <p className="lede mx-auto mt-2 text-center">
        This is the real reader, running in your browser, on a real syllabus. Nothing here is a
        recording.
      </p>

      <div className="card mt-8 grid gap-px overflow-hidden bg-line md:grid-cols-2">
        <div className="bg-elev p-4 sm:p-5">
          <p className="eyebrow">The syllabus</p>
          {/* Both columns share one line box of 28px and both heights are exact multiples of it,
              so a column pinned to its newest line always stops on a boundary rather than
              halfway through a row. */}
          <div
            ref={scroller}
            className="mt-3 h-[19.25rem] overflow-hidden font-mono text-[0.8125rem] leading-7 sm:h-[24.5rem]"
          >
            <ol aria-label="The syllabus">
              {lines.map((line, i) => (
                <li key={`${i}-${line}`} className={i === shown - 1 && !done ? 'text-fg' : 'text-muted'}>
                  {line}
                </li>
              ))}
            </ol>
            {!done && <span className="caret" aria-hidden="true" />}
          </div>
        </div>

        <div className="bg-elev p-4 sm:p-5">
          <p className="eyebrow">What it found</p>
          <div ref={rowScroller} className="mt-3 h-[19.25rem] overflow-hidden sm:h-[24.5rem]">
            <ul aria-label="What it found">
              {visible.map((r) => (
                <li key={r.key} className="pop-in flex h-7 items-center gap-3 text-[0.9375rem]">
                  <span className="w-20 shrink-0 font-semibold text-accent tabular-nums">
                    {dateLabel(r.date, r.endDate)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  {r.time && <span className="shrink-0 text-sm text-muted tabular-nums">{timeLabel(r.time)}</span>}
                  {r.uncertain && (
                    <span className="shrink-0 rounded bg-warn-soft px-1.5 py-0.5 text-xs font-medium text-warn">
                      check
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {visible.length === 0 && (
              <p className="text-sm text-muted">Reading {term} out of the dates on the page…</p>
            )}
          </div>
        </div>
      </div>

      {done && (
        <section
          aria-label="Also read"
          className="stagger mt-4 grid gap-3 sm:grid-cols-2"
        >
          {meetingLine && (
            <div className="card p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Check size={15} className="text-accent" /> The weekly class, as a repeating event
              </p>
              <p className="mt-1.5 text-[0.9375rem] text-muted">{meetingLine}</p>
            </div>
          )}
          {weights.length > 0 && (
            <div className="card p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Check size={15} className="text-accent" /> The grading table, as a grade calculator
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.9375rem] text-muted">
                {weights.map((w) => (
                  <li key={w.id}>{`${w.label} ${w.weight}%`}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onSample && (
          <button type="button" onClick={onSample} className="btn btn-primary">
            Try it on a sample <ArrowRight size={17} />
          </button>
        )}
        {done && (
          <button type="button" onClick={replay} className="btn btn-ghost">
            Watch it again
          </button>
        )}
      </div>
    </section>
  )
}
