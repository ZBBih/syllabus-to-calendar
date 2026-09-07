import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { CORES } from '../scripts/vendor-ocr.mjs'

/**
 * The recogniser picks its core at runtime from what the visitor's browser supports, and asking
 * for one this origin does not serve is a hard failure: the worker throws a NetworkError and the
 * photo is never read. That happened for every current Chrome until the relaxed-SIMD build was
 * vendored, and nothing in the suite noticed, so this is the thing that notices.
 */
describe('vendored OCR assets', () => {
  const at = (name: string) => new URL(`../public/tesseract/${name}`, import.meta.url)

  it('ships the worker and the language model', () => {
    expect(existsSync(at('worker.min.js'))).toBe(true)
    expect(existsSync(at('eng.traineddata.gz'))).toBe(true)
  })

  it.each(CORES)('ships %s, both the loader and the wasm', (core) => {
    expect(existsSync(at(`${core}.wasm.js`))).toBe(true)
    expect(existsSync(at(`${core}.wasm`))).toBe(true)
  })

  it('covers the cores tesseract.js can choose between', () => {
    // relaxed SIMD for current Chrome, SIMD for older engines, plain for anything without it.
    expect(CORES).toEqual(['tesseract-core-relaxedsimd-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-lstm'])
  })
})
