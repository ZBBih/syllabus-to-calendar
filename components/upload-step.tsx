'use client'

import { useState, type Dispatch } from 'react'
import type { Action, Course, State } from '@/lib/store'
import { nameFromFileName } from '@/lib/course-name'
import { SAMPLE_NAME, SAMPLE_TEXT } from '@/lib/sample'
import { FileDrop } from './file-drop'
import { ClassRow } from './class-row'
import { PasteSheet } from './paste-sheet'

export function canProceed(courses: Course[]) {
  return courses.some((c) => c.name.trim() && c.events.length > 0)
}

export function UploadStep({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [sheet, setSheet] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null })
  const visible = state.courses.filter((c) => c.name.trim() || c.text.trim() || c.events.length)
  const empty = visible.length === 0
  const ready = canProceed(state.courses)

  return (
    <div className="step-enter">
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Drop your syllabi</h1>
      <p className="mt-2 text-muted">Each file becomes a class. We find the dates while you watch.</p>

      <FileDrop
        multiple
        hero
        className="mt-6"
        onFiles={(files) => dispatch({ type: 'addFromFiles', files: files.map((f) => ({ name: nameFromFileName(f.fileName), text: f.text })) })}
      />

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted">
        <button type="button" onClick={() => setSheet({ open: true, course: null })} className="font-semibold text-accent-strong hover:underline">
          Add by pasting
        </button>
        {empty && (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'addFromFiles', files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT }] })}
              className="font-semibold text-accent-strong hover:underline"
            >
              Try a sample
            </button>
          </>
        )}
      </div>

      {!empty && (
        <div className="mt-8 space-y-3 stagger">
          {visible.map((c, i) => (
            <ClassRow
              key={c.id}
              course={c}
              index={i}
              canRemove={state.courses.length > 1}
              dispatch={dispatch}
              onEditText={() => setSheet({ open: true, course: c })}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-end gap-3">
        {!ready && !empty && <span className="text-sm text-muted">Each class needs a name and at least one date.</span>}
        <button type="button" disabled={!ready} onClick={() => dispatch({ type: 'setStep', step: 2 })} className="btn btn-primary">
          Review dates →
        </button>
      </div>

      {sheet.open && <PasteSheet course={sheet.course} dispatch={dispatch} onClose={() => setSheet({ open: false, course: null })} />}
    </div>
  )
}
