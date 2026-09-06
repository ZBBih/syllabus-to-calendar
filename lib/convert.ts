import { imageToText } from './ocr'

export class UnsupportedFileError extends Error {
  constructor(public ext: string) {
    super(`Unsupported file type "${ext || 'unknown'}". Please upload a PDF, Word (.docx), image, or text file, or paste the text.`)
    this.name = 'UnsupportedFileError'
  }
}

export class NoTextLayerError extends Error {
  constructor() {
    super('This PDF is a scan with no text in it. Take a photo or screenshot of the page instead and we will read it, or paste the text.')
    this.name = 'NoTextLayerError'
  }
}

export const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic', 'heif']
export const ACCEPT = '.pdf,.docx,.txt,.md,image/*'
export const MAX_BYTES = 25 * 1024 * 1024

export class FileTooLargeError extends Error {
  constructor(size: number) {
    super(`That file is ${(size / 1024 / 1024).toFixed(0)} MB. The limit is 25 MB; a syllabus PDF is usually under 5 MB.`)
    this.name = 'FileTooLargeError'
  }
}

export function normalizeText(s: string): string {
  return s.replace(/\r\n?/g, '\n').replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function extOf(file: File) {
  const m = /\.([a-z0-9]+)$/i.exec(file.name)
  return m ? m[1].toLowerCase() : ''
}

export function isImage(file: File) {
  return file.type.startsWith('image/') || IMAGE_EXTS.includes(extOf(file))
}

async function pdfToText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    let last: number | null = null
    let buf = ''
    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = Math.round(item.transform[5])
      if (last !== null && Math.abs(y - last) > 2) buf += '\n'
      else if (buf && !buf.endsWith('\n')) buf += ' '
      buf += item.str
      last = y
    }
    pages.push(buf)
  }
  const text = normalizeText(pages.join('\n\n'))
  if (!text) throw new NoTextLayerError()
  return text
}

async function docxToText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return normalizeText(value)
}

export type ConvertProgress = (stage: 'reading' | 'scanning', fraction?: number) => void

export async function fileToText(file: File, onProgress?: ConvertProgress): Promise<string> {
  if (file.size > MAX_BYTES) throw new FileTooLargeError(file.size)
  const ext = extOf(file)
  const mime = file.type
  onProgress?.('reading')
  if (isImage(file)) {
    onProgress?.('scanning', 0)
    return normalizeText(await imageToText(file, (f) => onProgress?.('scanning', f)))
  }
  if (ext === 'pdf' || mime === 'application/pdf') return pdfToText(file)
  if (ext === 'docx') return docxToText(file)
  if (ext === 'txt' || ext === 'md' || mime.startsWith('text/')) return normalizeText(await file.text())
  throw new UnsupportedFileError(ext)
}
