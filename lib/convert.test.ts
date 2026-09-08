import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileToText, normalizeText, UnsupportedFileError, FileTooLargeError, TextTooLongError, MAX_BYTES, MAX_TEXT_CHARS } from './convert'

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

/**
 * The size limit is a limit on bytes, and bytes are not the thing that hangs the tab. 25 MB of
 * plain text is 25 million characters going through the date scanner line by line, and a 25 MB
 * PDF can hold thousands of pages. Neither is a syllabus, and both take the page down with them.
 */
describe('limits on how much text can arrive', () => {
  it('rejects a file whose text is longer than any syllabus', async () => {
    const f = new File(['a'.repeat(MAX_TEXT_CHARS + 1)], 'reader.txt', { type: 'text/plain' })
    await expect(fileToText(f)).rejects.toBeInstanceOf(TextTooLongError)
  })

  it('accepts text right up to the limit', async () => {
    const f = new File(['a'.repeat(MAX_TEXT_CHARS)], 'long.txt', { type: 'text/plain' })
    expect((await fileToText(f)).length).toBe(MAX_TEXT_CHARS)
  })

  it('says how long the text was and what to do about it', async () => {
    const f = new File(['a'.repeat(MAX_TEXT_CHARS + 1)], 'reader.txt', { type: 'text/plain' })
    await expect(fileToText(f)).rejects.toThrow(/paste/i)
  })
})
