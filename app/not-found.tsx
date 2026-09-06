import Link from 'next/link'
import { Logo } from '@/components/logo'

export const metadata = { title: 'Not on the syllabus' }

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="rise">
        <Logo size={88} />
      </div>
      <h1 className="h1 rise mt-8">That page is not on the syllabus.</h1>
      <p className="lede rise mx-auto mt-4" style={{ animationDelay: '60ms' }}>
        Whatever you were looking for is not due here. The real work is back on the home page.
      </p>
      <Link href="/" className="btn btn-primary rise mt-8" style={{ animationDelay: '120ms' }}>
        Back to Syllabify
      </Link>
    </main>
  )
}
