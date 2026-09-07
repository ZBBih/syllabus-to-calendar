// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { OcrFailedError, OcrUnavailableError } from './ocr'

describe('OcrUnavailableError', () => {
  it('carries the reason tesseract gave, even when it threw a bare string', () => {
    const e = new OcrUnavailableError('start', 'NetworkError: failed to load tesseract-core.wasm.js')
    expect(e.message).toContain('Could not start the text recogniser')
    expect(e.message).toContain('NetworkError: failed to load tesseract-core.wasm.js')
  })

  it('carries the reason from a real Error too', () => {
    const e = new OcrUnavailableError('read', new Error('out of memory'))
    expect(e.message).toContain('Could not finish reading that picture')
    expect(e.message).toContain('out of memory')
  })

  it('still reads as a sentence when there is no reason to give', () => {
    const e = new OcrUnavailableError('start', { weird: true })
    expect(e.message).toBe('Could not start the text recogniser. Reload the page and try again, or paste the text instead.')
  })

  it('is distinct from an image that simply had no text in it', () => {
    expect(new OcrFailedError().message).toContain('No readable text')
  })
})
