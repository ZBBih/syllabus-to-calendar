'use client'

import { useRef, useState } from 'react'
import { ACCEPT, fileToText, isImage } from '@/lib/convert'
import { Camera, Upload } from './icons'

export type ConvertedFile = { fileName: string; text: string; viaPhoto: boolean }

type Props = {
  onFiles: (files: ConvertedFile[]) => void
  multiple?: boolean
  hero?: boolean
  className?: string
}

export function FileDrop({ onFiles, multiple = false, hero = false, className = '' }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  async function handle(list: FileList | null | undefined) {
    const files = Array.from(list ?? []).slice(0, multiple ? 20 : 1)
    if (files.length === 0) return
    setErrors([])
    const done: ConvertedFile[] = []
    const errs: string[] = []
    for (const [i, file] of files.entries()) {
      const prefix = files.length > 1 ? `${i + 1} of ${files.length}: ` : ''
      setBusy(`${prefix}reading ${file.name}`)
      try {
        const text = await fileToText(file, (stage, fraction) => {
          if (stage !== 'scanning') return
          const pct = fraction === undefined ? 0 : Math.round(fraction * 100)
          setBusy(`${prefix}reading the picture, ${pct}%`)
        })
        done.push({ fileName: file.name, text, viaPhoto: isImage(file) })
      } catch (e) {
        // Never swallow the reason: a bare "could not read that file" is not something a
        // student can act on, and it is not something they can report back either.
        const why = e instanceof Error ? e.message : String(e ?? '').trim()
        errs.push(`${file.name}: ${why || 'could not read that file.'}`)
      }
    }
    setBusy(null)
    setErrors(errs)
    if (done.length) onFiles(done)
    if (input.current) input.current.value = ''
    if (camera.current) camera.current.value = ''
  }

  const idle = busy === null

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          handle(e.dataTransfer.files)
        }}
        aria-busy={busy !== null}
        aria-label={multiple ? 'Choose or drop syllabus files' : 'Choose or drop a syllabus file'}
        className={`cursor-pointer rounded-xl border border-dashed text-center transition-colors ${hero ? 'px-6 py-9' : 'px-4 py-5'} ${
          over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-elev hover:border-accent hover:bg-accent-soft/40'
        }`}
      >
        {hero ? (
          <>
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Upload size={20} />
            </div>
            <p className="font-display text-xl">{busy ? capitalise(busy) : 'Drop your syllabi here'}</p>
            <p className="mt-1 text-sm text-muted">
              {busy ? 'Finding every date as it goes.' : 'PDF, Word, a screenshot, or a photo of the page. Each file becomes a class.'}
            </p>
          </>
        ) : (
          <p className="text-sm font-medium">{busy ? capitalise(busy) : 'Drop a syllabus, or click to choose'}</p>
        )}
      </div>

      <input ref={input} type="file" accept={ACCEPT} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />

      {idle && (
        <button type="button" onClick={() => camera.current?.click()} className="btn btn-ghost btn-sm mt-2 w-full sm:hidden">
          <Camera size={14} /> Take a photo of the page instead
        </button>
      )}

      {errors.map((err) => (
        <p key={err} role="alert" className="rise mt-2 text-sm font-medium text-danger">
          {err}
        </p>
      ))}
    </div>
  )
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
