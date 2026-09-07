import type { Metadata } from 'next'
import Link from 'next/link'
import { ArtCrop } from '@/components/hero-art'

/**
 * A 404 already answers with the right status code, which is what a crawler acts on. The
 * noindex is for the case that status gets lost — a proxy, a preview, a screenshot service —
 * and the title keeps a dead-end tab from reading as the product itself in someone's history.
 *
 * This is a server component so that metadata can be exported at all; nothing on the page is
 * interactive, so it costs nothing to render it that way.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <ArtCrop part="document" size={180} className="crop-in" />
      <h1 className="h1 rise mt-6">That page is not on the syllabus.</h1>
      <p className="lede rise mx-auto mt-4" style={{ animationDelay: '60ms' }}>
        Whatever you were looking for is not due here. The real work is back on the home page.
      </p>
      <Link href="/" className="btn btn-primary btn-hero rise mt-8" style={{ animationDelay: '120ms' }}>
        Back to Syllabify
      </Link>
      <p className="rise mt-6 text-xs text-muted" style={{ animationDelay: '180ms' }}>
        Nothing you had in progress is lost. Your classes are saved in this browser.
      </p>
    </main>
  )
}
