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

const files = [
  [worker, 'worker.min.js'],
  [join(coreDir, 'tesseract-core-simd-lstm.wasm.js'), 'tesseract-core-simd-lstm.wasm.js'],
  [join(coreDir, 'tesseract-core-simd-lstm.wasm'), 'tesseract-core-simd-lstm.wasm'],
  [join(coreDir, 'tesseract-core-lstm.wasm.js'), 'tesseract-core-lstm.wasm.js'],
  [join(coreDir, 'tesseract-core-lstm.wasm'), 'tesseract-core-lstm.wasm'],
]

await mkdir(out, { recursive: true })
for (const [from, name] of files) await copyFile(from, new URL(name, out))
console.log(`vendored ${files.length} OCR files into public/tesseract`)
