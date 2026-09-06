'use client'

import Link from 'next/link'
import { ArtCrop } from '@/components/hero-art'

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
    </main>
  )
}
