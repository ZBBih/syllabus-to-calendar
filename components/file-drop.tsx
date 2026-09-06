'use client'

import { useRef, useState } from 'react'
import { ACCEPT, fileToText } from '@/lib/convert'

export type ConvertedFile = { fileName: string; text: string }

type Props = {
  /** Called once per successfully converted file. */
  onFiles: (files: ConvertedFile[]) => void
  multiple?: boolean
  label?: string
  className?: string
}

export function FileDrop({ onFiles, multiple = false, label, className = '' }: Props) {
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
      setBusy(files.length > 1 ? `Converting ${i + 1} of ${files.length}…` : 'Converting…')
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

  const text =
    busy ??
    label ??
    (multiple
      ? 'Drop all your syllabi here, or click to choose (PDF, Word, or text)'
      : 'Drop a syllabus here or click to choose (PDF, Word, or text)')

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
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 text-center text-sm transition ${
          multiple ? 'py-8' : 'py-6'
        } ${over ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400'}`}
      >
        {text}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      {errors.map((err) => (
        <p key={err} className="mt-2 text-sm text-red-600">
          {err}
        </p>
      ))}
    </div>
  )
}
