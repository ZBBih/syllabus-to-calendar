import Link from 'next/link'
import { Logo } from '@/components/logo'

export const metadata = { title: 'Not on the syllabus' }

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="pop">
        <Logo size={88} />
      </div>
      <h1 className="rise mt-8 font-display text-5xl font-black tracking-tight">That page is not on the syllabus.</h1>
      <p className="rise mt-4 text-muted" style={{ animationDelay: '80ms' }}>
        Whatever you were looking for is not due here. The real work is back on the home page.
      </p>
      <Link href="/" className="btn btn-primary rise mt-8" style={{ animationDelay: '160ms' }}>
        Back to Syllabify
      </Link>
    </main>
  )
}
