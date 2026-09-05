'use client'

import { useRef, useState } from 'react'
import { ACCEPT, fileToText } from '@/lib/convert'

export function FileDrop({ onText }: { onText: (text: string, fileName: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      onText(await fileToText(file), file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
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
          handle(e.dataTransfer.files[0])
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition ${
          over ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400'
        }`}
      >
        {busy ? 'Converting…' : 'Drop a syllabus here or click to choose (PDF, Word, or text)'}
      </div>
      <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
