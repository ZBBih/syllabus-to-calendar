'use client'

import { useState, type Dispatch } from 'react'
import type { Action, Course, State } from '@/lib/store'
import { isComplete } from '@/lib/export'
import { diffCount } from '@/lib/merge'
import { ReviewTable } from './review-table'
import { DatePreview, previewRows } from './date-preview'
import { PasteSheet } from './paste-sheet'
import { ReadReport } from './read-report'
import { ChangeSummary } from './change-summary'
import { GradePanel } from './grade-panel'
import { ArrowLeft, ArrowRight, Camera, Chevron, Plus } from './icons'

export function ReviewStep({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const courses = state.courses.filter((c) => c.events.length > 0)
  const active = courses.find((c) => c.id === state.activeCourseId) ?? courses[0]
  const [needsCheck, setNeedsCheck] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [reading, setReading] = useState<Course | null>(null)
  // The export screen warns that some days have two or more things due; the list that shows
  // which days those are opens by default when there is actually a clash to look at.
  const clashes = previewRows(state.courses).filter((r) => r.clash).length
  const [showAll, setShowAll] = useState(clashes > 0)

  if (!active) {
    return (
      <div className="step-enter">
        <p className="text-muted">No dates yet. Go back and add a syllabus.</p>
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="btn btn-secondary mt-4">
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    )
  }

  // Checking amber rows is the one job repeated once per class in a single sitting, so the
  // filter reaches across every class rather than the active one. A student with six syllabi
  // fixes one list instead of selecting each tab in turn to hunt for what is left.
  const needsFixing = (e: (typeof active.events)[number]) => e.confidence === 'low' || !isComplete(e) || e.missing === true
  const queue = courses.map((c) => ({ course: c, rows: c.events.filter(needsFixing) })).filter((g) => g.rows.length > 0)
  const queueTotal = queue.reduce((n, g) => n + g.rows.length, 0)
  const included = active.events.filter((e) => e.include !== false && isComplete(e)).length
  const incomplete = active.events.filter((e) => !isComplete(e)).length

  // All, None and Needs check are one group: whichever is showing is the one lit up. Picking a
  // selection drops the filter, so you can never be looking at a subset while a button claims
  // everything is chosen.
  const every = active.events.length > 0 && active.events.every((e) => e.include !== false)
  const none = active.events.length > 0 && active.events.every((e) => e.include === false)
  const allLit = every && !needsCheck
  const noneLit = none && !needsCheck

  function selectAll(include: boolean) {
    setNeedsCheck(false)
    dispatch({ type: 'setIncludeAll', courseId: active.id, include })
  }

  return (
    <div className="step-enter">
      <h1 className="h1">Check the dates</h1>
      <p className="lede mt-2">
        Nothing reaches your calendar until you say so. Fix anything marked amber, untick what you do not want, and add what was missed.
      </p>

      {courses.length > 1 && (
        <div role="tablist" aria-label="Classes" className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
          {courses.map((c) => {
            const n = c.events.filter(needsFixing).length
            const changes = diffCount(c.diff)
            const on = c.id === active.id
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={on}
                onClick={() => dispatch({ type: 'setActive', id: c.id })}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                  on ? 'border-accent bg-accent text-accent-ink font-semibold' : 'border-line-strong bg-elev text-fg hover:border-muted'
                }`}
              >
                {c.name.trim() || <span className={on ? '' : 'text-warn'}>Unnamed</span>}
                {n > 0 && <span className={`pill ${on ? 'bg-black/15 text-current' : 'pill-warn'}`}>{n}</span>}
                {changes > 0 && n === 0 && <span className={`pill ${on ? 'bg-black/15 text-current' : 'pill-ok'}`}>{changes} new</span>}
              </button>
            )
          })}
        </div>
      )}

      {active.viaPhoto && (
        <div className="note note-warn rise mt-4 flex gap-2.5">
          <span className="mt-0.5 shrink-0 text-warn">
            <Camera size={16} />
          </span>
          <span>
            <strong>This one came from a picture.</strong> Reading text off a photo is the least reliable route, and a misread month or a mangled word will show
            up here as a wrong date or a missing row. Give this list a closer look than usual, and paste the text instead if too much of it is off.
          </span>
        </div>
      )}

      <ChangeSummary course={active} dispatch={dispatch} />

      <div className="card mt-4 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-auto text-sm text-muted">
            {active.events.length} event{active.events.length === 1 ? '' : 's'}, {included} will export
            {incomplete > 0 && <span className="pill pill-warn ml-2">{incomplete} need a date and title</span>}
          </span>
          <button type="button" aria-pressed={allLit} onClick={() => selectAll(true)} className={`btn btn-sm ${allLit ? 'btn-primary' : 'btn-secondary'}`}>
            All
          </button>
          <button type="button" aria-pressed={noneLit} onClick={() => selectAll(false)} className={`btn btn-sm ${noneLit ? 'btn-primary' : 'btn-secondary'}`}>
            None
          </button>
          <button
            type="button"
            aria-pressed={needsCheck}
            disabled={queueTotal === 0 && !needsCheck}
            onClick={() => setNeedsCheck((v) => !v)}
            className={`btn btn-sm ${needsCheck ? 'btn-primary' : 'btn-secondary'}`}
          >
            Needs check {queueTotal > 0 && `(${queueTotal})`}
          </button>
          <button type="button" onClick={() => dispatch({ type: 'addEvent', courseId: active.id })} className="btn btn-secondary btn-sm">
            <Plus size={13} /> Row
          </button>
          <button type="button" onClick={() => setEditing(active)} className="btn btn-secondary btn-sm">
            Edit text
          </button>
          {active.text.trim() !== '' && (
            <button type="button" onClick={() => setReading(active)} className="btn btn-secondary btn-sm">
              What we read
            </button>
          )}
        </div>
        {needsCheck ? (
          queue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing left to check. Every row has a date and a title, and none of them are in doubt.</p>
          ) : (
            <div className="space-y-4">
              {queue.map((g) => (
                <div key={g.course.id}>
                  {courses.length > 1 && (
                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {g.course.name.trim() || 'Unnamed class'} <span className="pill pill-warn ml-1">{g.rows.length}</span>
                    </h3>
                  )}
                  <ReviewTable course={g.course} rows={g.rows} dispatch={dispatch} />
                </div>
              ))}
            </div>
          )
        ) : (
          <ReviewTable course={active} rows={active.events} dispatch={dispatch} />
        )}
      </div>

      <GradePanel course={active} dispatch={dispatch} />

      {courses.length > 1 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="btn btn-ghost btn-sm">
            <Chevron open={showAll} size={13} /> All classes by date
            {clashes > 0 && <span className="pill pill-warn ml-2">{clashes} share a day</span>}
          </button>
          {showAll && (
            <div className="mt-2">
              <DatePreview courses={state.courses} />
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="btn btn-secondary">
          <ArrowLeft size={15} /> Back
        </button>
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 3 })} className="btn btn-primary">
          Put it on my calendar <ArrowRight size={15} />
        </button>
      </div>

      {editing && <PasteSheet course={editing} dispatch={dispatch} onClose={() => setEditing(null)} />}
      {reading && <ReadReport course={reading} dispatch={dispatch} onClose={() => setReading(null)} />}
    </div>
  )
}
