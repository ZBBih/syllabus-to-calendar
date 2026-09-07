'use client'

import { useEffect, useMemo, useState, type Dispatch } from 'react'
import { createPortal } from 'react-dom'
import { readReport } from '@/lib/extract'
import type { Action, Course } from '@/lib/store'
import { Check, Plus, X } from './icons'

/**
 * What the app read, line by line.
 *
 * Every other screen can only show what extraction found, which leaves the student's real
 * question unanswered: what did it miss? Retyping the whole syllabus is the safe answer to an
 * unknowable risk, and that is the habit this has to beat. So the syllabus is shown back with
 * the captured dates marked, and any date the parser found but did not use is offered with the
 * reason and a single tap to keep it.
 */
export function ReadReport({ course, dispatch, onClose }: { course: Course; dispatch: Dispatch<Action>; onClose: () => void }) {
  const lines = useMemo(() => readReport(course.text, course.term), [course.text, course.term])
  const [added, setAdded] = useState<string[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const found = lines.reduce((n, l) => n + l.captured.length, 0)
  const offered = lines.reduce((n, l) => n + l.skipped.filter((s) => s.date).length, 0)

  function keep(key: string, date: string, title: string, source: string) {
    dispatch({ type: 'addEvent', courseId: course.id, preset: { date, title, source } })
    setAdded((a) => [...a, key])
  }

  // Portalled to the body: an entrance animation anywhere up the tree leaves an identity
  // transform behind, and that alone makes a fixed sheet position against the animated element
  // instead of the viewport, which drops it off the bottom of a long screen.
  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="read-title" className="sheet">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id="read-title" className="font-display text-xl">
            What we read in {course.name || 'this syllabus'}
          </h2>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          {found === 0
            ? 'No dates came out of this text. Anything the parser did see is marked below.'
            : `${found} date${found === 1 ? '' : 's'} came from the lines marked with a tick.`}
          {offered > 0 &&
            ` ${offered} more date${offered === 1 ? ' was' : 's were'} found and left out; keep any that should count.`}
        </p>

        {lines.length === 0 ? (
          <p className="text-sm text-muted">There is no syllabus text saved for this class.</p>
        ) : (
          <ol className="read-lines">
            {lines.map((line, i) => {
              const hit = line.captured.length > 0
              return (
                <li key={i} className={`read-line ${hit ? 'read-line-hit' : ''}`}>
                  <span className="read-mark" aria-hidden={!hit}>
                    {hit && <Check size={12} />}
                  </span>
                  <div className="min-w-0">
                    <p className="read-text">{line.text}</p>
                    {line.captured.map((c, n) => (
                      <p key={`c${n}`} className="mt-0.5 text-xs text-accent">
                        Taken as {c.title || 'an untitled row'} on {c.date}
                        {c.endDate ? ` to ${c.endDate}` : ''}
                        {c.time ? ` at ${c.time}` : ''}
                      </p>
                    ))}
                    {line.skipped.map((s, n) => {
                      const key = `${i}-${n}`
                      return (
                        <p key={`s${n}`} className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span>
                            <strong className="font-medium text-warn">{s.text}</strong> was left out: {s.reason}.
                          </span>
                          {s.date &&
                            (added.includes(key) ? (
                              <span className="pill pill-ok">Added to your dates</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => keep(key, s.date!, s.title || line.text, line.text)}
                                className="btn btn-secondary btn-sm"
                              >
                                <Plus size={12} /> Keep {s.date}
                              </button>
                            ))}
                        </p>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
