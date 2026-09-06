'use client'

import { useRef, useState } from 'react'
import { ACCEPT, fileToText } from '@/lib/convert'

export type ConvertedFile = { fileName: string; text: string }

type Props = {
  onFiles: (files: ConvertedFile[]) => void
  multiple?: boolean
  hero?: boolean
  className?: string
}

export function FileDrop({ onFiles, multiple = false, hero = false, className = '' }: Props) {
  const input = useRef<HTMLInputElement>(null)
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
      setBusy(files.length > 1 ? `Reading ${i + 1} of ${files.length}…` : 'Reading…')
      try {
        done.push({ fileName: file.name, text: await fileToText(file) })
      } catch (e) {
        errs.push(`${file.name}: ${e instanceof Error ? e.message : 'could not read that file.'}`)
      }
    }
    setBusy(null)
    setErrors(errs)
    if (done.length) onFiles(done)
    if (input.current) input.current.value = ''
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
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
        className={`breathe cursor-pointer rounded-2xl border-2 border-dashed text-center transition-colors ${
          hero ? 'px-6 py-10' : 'px-4 py-5'
        } ${over ? 'border-accent bg-accent-soft' : 'border-line bg-elev/60 hover:border-accent'}`}
      >
        {hero ? (
          <>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M6 10l6-6 6 6" />
                <path d="M4 20h16" />
              </svg>
            </div>
            <p className="font-display text-xl font-extrabold">{busy ?? 'Drop all your syllabi here'}</p>
            <p className="mt-1 text-sm text-muted">
              {busy ? 'Finding every date as we go.' : 'PDF, Word, or text. Or click to choose. Each file becomes a class.'}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold">{busy ?? 'Drop a syllabus or click to choose'}</p>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPT} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      {errors.map((err) => (
        <p key={err} className="pop mt-2 text-sm font-medium text-danger">
          {err}
        </p>
      ))}
    </div>
  )
}
