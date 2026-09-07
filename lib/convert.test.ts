import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileToText, normalizeText, UnsupportedFileError, FileTooLargeError, MAX_BYTES } from './convert'

describe('normalizeText', () => {
  it('collapses CRLF and blank runs', () => {
    expect(normalizeText('a\r\n\r\n\r\n\r\nb  ')).toBe('a\n\nb')
  })
})

describe('fileToText', () => {
  it('rejects unsupported extensions', async () => {
    const f = new File(['x'], 'setup.exe')
    await expect(fileToText(f)).rejects.toBeInstanceOf(UnsupportedFileError)
  })
  it('rejects oversized files before parsing', async () => {
    const f = new File([new Uint8Array(MAX_BYTES + 1)], 'huge.txt', { type: 'text/plain' })
    await expect(fileToText(f)).rejects.toBeInstanceOf(FileTooLargeError)
  })
  it('reads txt', async () => {
    const f = new File(['hi\r\n\r\n\r\nthere'], 'notes.txt', { type: 'text/plain' })
    expect(await fileToText(f)).toBe('hi\n\nthere')
  })
  it('reads a real Word document, paragraph per line', async () => {
    // A genuine .docx, built by fixtures/make-docx.mjs, rather than a stub of one: the point of
    // the test is that mammoth and the paragraph-to-line conversion hold together.
    const bytes = readFileSync(new URL('./fixtures/syllabus.docx', import.meta.url))
    const f = new File([bytes], 'BIOL-210-syllabus.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const text = await fileToText(f)
    expect(text).toContain('BIOL 210: Genetics')
    expect(text).toContain('Spring 2027')
    expect(text.split('\n')).toContain('Feb 11 Problem set 1 due at 11:59pm')
  })
})
