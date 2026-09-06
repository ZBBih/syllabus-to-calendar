'use client'

import { useEffect, useRef, useState, type Dispatch } from 'react'
import { extractEvents, SEASONS, type Season, type Term } from '@/lib/extract'
import { defaultTerm, type Action, type Course } from '@/lib/store'
import { FileDrop } from './file-drop'
import { nameFromFileName } from '@/lib/course-name'

const thisYear = new Date().getFullYear()
const YEARS = [thisYear - 1, thisYear, thisYear + 1]

export function PasteSheet({ course, dispatch, onClose }: { course: Course | null; dispatch: Dispatch<Action>; onClose: () => void }) {
  const [name, setName] = useState(course?.name ?? '')
  const [term, setTerm] = useState<Term>(course?.term ?? defaultTerm())
  const [text, setText] = useState(course?.text ?? '')
  const area = useRef<HTMLTextAreaElement>(null)

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
      dispatch({ type: 'addFromFiles', files: [{ name: name.trim(), text }] })
    }
    onClose()
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="sheet-title" className="sheet">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="sheet-title" className="font-display text-xl font-extrabold">
            {course ? 'Edit syllabus text' : 'Add a class by pasting'}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-ghost px-2 py-1" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="clearable">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name, e.g. ECON 101" aria-label="Class name" className="field pr-9" />
            {name && (
              <button type="button" className="clear" aria-label="Clear name" onClick={() => setName('')}>
                ✕
              </button>
            )}
          </div>
          <select value={term.season} aria-label="Term" onChange={(e) => setTerm({ ...term, season: e.target.value as Season })} className="field w-auto">
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={term.year} aria-label="Year" onChange={(e) => setTerm({ ...term, year: Number(e.target.value) })} className="field w-auto">
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        <FileDrop
          className="mt-3"
          onFiles={([f]) => {
            setText(f.text)
            if (!name.trim()) setName(nameFromFileName(f.fileName))
          }}
        />

        <div className="clearable mt-3">
          <textarea
            ref={area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste the syllabus here. The schedule section is all it needs."
            className="field font-mono text-xs"
          />
          {text && (
            <button type="button" className="clear !top-3 !translate-y-0" aria-label="Clear text" onClick={() => setText('')}>
              ✕
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
    </>
  )
}
