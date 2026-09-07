// Copies the Tesseract worker and wasm core out of node_modules into public/tesseract
// so text recognition runs entirely from our own origin. Nothing is fetched from a CDN
// at runtime, which keeps the "nothing leaves your device" promise literally true.
import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const out = new URL('../public/tesseract/', import.meta.url)

const worker = require.resolve('tesseract.js/dist/worker.min.js')
const coreDir = dirname(require.resolve('tesseract.js-core/package.json'))

/**
 * Every core the worker may ask for, not just the one this machine would pick.
 *
 * tesseract chooses at runtime from what the visitor's browser supports, and a core it asks
 * for and cannot find is a hard failure: the worker throws a NetworkError and the photo never
 * gets read. Current Chrome asks for the relaxed-SIMD build, older engines fall back to plain
 * SIMD, and anything without SIMD needs the base build, so all three ship.
 */
export const CORES = ['tesseract-core-relaxedsimd-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-lstm']

const files = [
  [worker, 'worker.min.js'],
  ...CORES.flatMap((core) => [
    [join(coreDir, `${core}.wasm.js`), `${core}.wasm.js`],
    [join(coreDir, `${core}.wasm`), `${core}.wasm`],
  ]),
]

await mkdir(out, { recursive: true })
for (const [from, name] of files) await copyFile(from, new URL(name, out))
console.log(`vendored ${files.length} OCR files into public/tesseract`)
