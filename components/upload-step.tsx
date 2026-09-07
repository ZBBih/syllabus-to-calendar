'use client'

import { useState, type Dispatch } from 'react'
import type { Action, Course, State } from '@/lib/store'
import { nameFromFileName } from '@/lib/course-name'
import { SAMPLE_NAME, SAMPLE_TEXT } from '@/lib/sample'
import { FileDrop } from './file-drop'
import { ClassRow } from './class-row'
import { PasteSheet } from './paste-sheet'
import { ArrowLeft, ArrowRight } from './icons'

/** Every class that has dates must be named, and at least one such class must exist. */
export function canProceed(courses: Course[]) {
  const withDates = courses.filter((c) => c.events.length > 0)
  return withDates.length > 0 && withDates.every((c) => c.name.trim() !== '')
}

export function unnamedCount(courses: Course[]) {
  return courses.filter((c) => c.events.length > 0 && !c.name.trim()).length
}

export function UploadStep({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [sheet, setSheet] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null })
  const visible = state.courses.filter((c) => c.name.trim() || c.text.trim() || c.events.length)
  const empty = visible.length === 0
  const ready = canProceed(state.courses)
  const unnamed = unnamedCount(state.courses)
  const returning = state.exportSequence > 0

  return (
    <div className="step-enter">
      {empty ? (
        <>
          <button type="button" onClick={() => dispatch({ type: 'setStep', step: 0 })} className="btn btn-ghost btn-sm -ml-2 mb-3">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="h1">Drop your syllabi</h1>
          <p className="lede mt-2">Each file becomes a class. Every date, meeting and grading table gets pulled out while you watch.</p>
        </>
      ) : (
        <>
          <h1 className="h1">Your classes</h1>
          <p className="lede mt-2">Name each one, check the term, then move on to the dates. The bin on a row removes that class.</p>
        </>
      )}

      {empty && returning && (
        <p className="note note-accent mt-6">
          Drop the revised syllabus over the top and the next export will correct what moved on your calendar instead of adding a second copy of everything.
        </p>
      )}

      <FileDrop
        multiple
        hero
        className="mt-6"
        onFiles={(files) => dispatch({ type: 'addFromFiles', files: files.map((f) => ({ name: nameFromFileName(f.fileName), text: f.text, viaPhoto: f.viaPhoto })) })}
      />

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <button type="button" onClick={() => setSheet({ open: true, course: null })} className="link">
          Add by pasting
        </button>
        {empty && (
          <>
            <span className="text-muted" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'addFromFiles', files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT, viaPhoto: false }] })}
              className="link"
            >
              Try a sample
            </button>
          </>
        )}
      </div>

      {!empty && (
        <div className="stagger mt-8 space-y-2.5">
          {visible.map((c, i) => (
            <ClassRow
              key={c.id}
              course={c}
              index={i}
              dispatch={dispatch}
              onEditText={() => setSheet({ open: true, course: c })}
            />
          ))}
        </div>
      )}

      {!empty && (
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          {!ready && (
            <span className="text-sm font-medium text-warn">
              {unnamed > 0 ? `Name ${unnamed === 1 ? 'the class' : `all ${unnamed} classes`} to continue.` : 'Each class needs at least one date.'}
            </span>
          )}
          <button type="button" disabled={!ready} onClick={() => dispatch({ type: 'setStep', step: 2 })} className="btn btn-primary">
            Review dates <ArrowRight size={15} />
          </button>
        </div>
      )}

      {empty && (
        <dl className="card-sunk mt-10 grid gap-4 p-4 text-xs leading-relaxed sm:grid-cols-2 sm:p-5">
          <div>
            <dt className="text-sm font-semibold">When a deadline moves</dt>
            <dd className="mt-1 text-muted">
              Drop the revised syllabus in again. You get a list of what changed, and the next export corrects your calendar in place rather than leaving two of
              everything.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">Why there is no Canvas login</dt>
            <dd className="mt-1 text-muted">
              A course page shows what your professor has entered so far. The syllabus has the whole term on the first day, which is when you actually want it.
            </dd>
          </div>
        </dl>
      )}

      {sheet.open && <PasteSheet course={sheet.course} dispatch={dispatch} onClose={() => setSheet({ open: false, course: null })} />}
    </div>
  )
}
