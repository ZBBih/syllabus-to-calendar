/**
 * Reads text off a photo or screenshot of a syllabus, in the browser.
 *
 * Students photograph the printed handout or screenshot the course page far more often than
 * they hunt down the original PDF, so this is the input that actually matches the behaviour.
 * The recogniser, its wasm core and the English model are all served from our own origin
 * (see scripts/vendor-ocr.mjs), so a photo never leaves the device and no third party learns
 * that a scan happened. The cost is a one-time download of about six megabytes, which the
 * browser then caches.
 */

const MAX_EDGE = 2200

export type OcrProgress = (fraction: number) => void

/** Big camera photos slow recognition down far more than they help it. */
async function toBitmap(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot read images.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas
}

export class OcrFailedError extends Error {
  constructor() {
    super('No readable text in that image. A flat, well-lit photo of the page works best, or paste the text instead.')
    this.name = 'OcrFailedError'
  }
}

/**
 * The recogniser did not start, or fell over part way.
 *
 * tesseract rejects with a bare string from inside its worker, which arrives here as something
 * that is not an Error and gets reported as "could not read that file" - true, useless, and
 * impossible to act on. The cause travels with the message instead.
 */
export class OcrUnavailableError extends Error {
  constructor(stage: 'start' | 'read', cause: unknown) {
    const detail = cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : ''
    super(
      stage === 'start'
        ? `Could not start the text recogniser${detail ? ` (${detail})` : ''}. Reload the page and try again, or paste the text instead.`
        : `Could not finish reading that picture${detail ? ` (${detail})` : ''}. Try again, or paste the text instead.`,
    )
    this.name = 'OcrUnavailableError'
  }
}

export async function imageToText(file: File, onProgress?: OcrProgress): Promise<string> {
  const canvas = await toBitmap(file)

  let worker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>>
  try {
    const { createWorker } = await import('tesseract.js')
    worker = await createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract',
      langPath: '/tesseract',
      gzip: true,
      logger: onProgress ? (m: { status: string; progress: number }) => m.status === 'recognizing text' && onProgress(m.progress) : undefined,
    })
  } catch (e) {
    throw new OcrUnavailableError('start', e)
  }

  try {
    const { data } = await worker.recognize(canvas)
    const text = (data.text ?? '').trim()
    if (!text) throw new OcrFailedError()
    return text
  } catch (e) {
    if (e instanceof OcrFailedError) throw e
    throw new OcrUnavailableError('read', e)
  } finally {
    await worker.terminate()
  }
}
