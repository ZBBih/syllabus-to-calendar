'use client'

import { useEffect, useRef, useState, type Dispatch } from 'react'
import { createPortal } from 'react-dom'
import { extractEvents, SEASONS, type Season, type Term } from '@/lib/extract'
import { defaultTerm, type Action, type Course } from '@/lib/store'
import { FileDrop } from './file-drop'
import { X } from './icons'
import { nameFromFileName, nameFromText } from '@/lib/course-name'
import { termFromText } from '@/lib/term'

const thisYear = new Date().getFullYear()
const YEARS = [thisYear - 1, thisYear, thisYear + 1]

export function PasteSheet({ course, dispatch, onClose }: { course: Course | null; dispatch: Dispatch<Action>; onClose: () => void }) {
  const [name, setName] = useState(course?.name ?? '')
  const [term, setTerm] = useState<Term>(course?.term ?? defaultTerm())
  const [text, setText] = useState(course?.text ?? '')
  const [termTouched, setTermTouched] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)

  /**
   * Take whatever the syllabus itself says for the fields the student has not filled in.
   *
   * The name is a gate: nothing can be added without one, and pasted text has no file name to
   * guess from, so this is the difference between tapping through and typing on a phone. The
   * term decides which dates count as inside the semester, so a syllabus for another term reads
   * as empty until it is right.
   */
  function readFromText(next: string) {
    setText(next)
    if (!name.trim()) setName(nameFromText(next))
    if (!termTouched) {
      const found = termFromText(next)
      if (found) setTerm(found)
    }
  }

  useEffect(() => {
    area.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = name.trim() !== '' && text.trim() !== ''

  function save() {
    if (!canSave) return
    if (course) {
      dispatch({ type: 'update', id: course.id, patch: { name: name.trim(), term, text } })
      dispatch({ type: 'mergeEvents', id: course.id, events: extractEvents(text, term) })
    } else {
      dispatch({ type: 'addFromFiles', files: [{ name: name.trim(), text, viaPhoto: false }] })
    }
    onClose()
  }

  // Portalled for the same reason as the read report: a fixed sheet inside an element that has
  // any transform, including the identity one an entrance animation leaves behind, is positioned
  // against that element rather than the viewport.
  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="sheet-title" className="sheet">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="sheet-title" className="font-display text-xl">
            {course ? 'Edit syllabus text' : 'Add a class by pasting'}
          </h2>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="clearable">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name, e.g. ECON 101" aria-label="Class name" className="field pr-9" />
            {name && (
              <button type="button" className="clear" aria-label="Clear name" onClick={() => setName('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={term.season}
            aria-label="Term"
            onChange={(e) => {
              setTermTouched(true)
              setTerm({ ...term, season: e.target.value as Season })
            }}
            className="field w-auto"
          >
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={term.year}
            aria-label="Year"
            onChange={(e) => {
              setTermTouched(true)
              setTerm({ ...term, year: Number(e.target.value) })
            }}
            className="field w-auto"
          >
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        <FileDrop
          className="mt-3"
          onFiles={([f]) => {
            readFromText(f.text)
            const fromFile = nameFromFileName(f.fileName)
            if (fromFile && !name.trim()) setName(fromFile)
          }}
        />

        <div className="clearable mt-3">
          <textarea
            ref={area}
            value={text}
            onChange={(e) => readFromText(e.target.value)}
            rows={10}
            placeholder="Paste the syllabus here. The schedule section is all it needs, though the grading table is worth including too."
            className="field font-mono text-xs"
          />
          {text && (
            <button type="button" className="clear !top-2.5 !translate-y-0" aria-label="Clear text" onClick={() => setText('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!canSave} className="btn btn-primary">
            {course ? 'Save and re-run' : 'Add class'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
