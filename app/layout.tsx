import type { Metadata, Viewport } from 'next'
import { Nunito, Geist } from 'next/font/google'
import './globals.css'

const display = Nunito({ variable: '--font-display', subsets: ['latin'], weight: ['700', '800', '900'] })
const body = Geist({ variable: '--font-body', subsets: ['latin'] })

const title = 'Syllabify'
const description = 'Syllabify your semester. Drop your syllabi, get every deadline on your calendar. No account, nothing uploaded.'

export const metadata: Metadata = {
  metadataBase: new URL('https://syllabus-to-calendar-ten.vercel.app'),
  title: { default: title, template: `%s · ${title}` },
  description,
  applicationName: title,
  openGraph: { title, description, siteName: title, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffaf0' },
    { media: '(prefers-color-scheme: dark)', color: '#16130f' },
  ],
}

const themeScript = `(function(){try{var t=localStorage.getItem('stc:theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${display.variable} ${body.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
