import { describe, it, expect } from 'vitest'
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
})
