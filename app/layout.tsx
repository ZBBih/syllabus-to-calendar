import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Geist } from 'next/font/google'
import './globals.css'

// An editorial serif for display against a neutral grotesk for everything else. The previous
// rounded display face is the default of every generated landing page, which is exactly why
// the product read as generic before a single word had been changed.
const display = Instrument_Serif({ variable: '--font-display', subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'] })
const body = Geist({ variable: '--font-body', subsets: ['latin'] })

const title = 'Syllabify'
const description =
  'Drop your syllabi and get every deadline on your calendar. No account, no class limit, and the file never leaves your device.'

export const metadata: Metadata = {
  metadataBase: new URL('https://syllabus-to-calendar-ten.vercel.app'),
  title: { default: `${title}: syllabus to calendar, no account`, template: `%s · ${title}` },
  description,
  applicationName: title,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title, statusBarStyle: 'default' },
  openGraph: { title, description, siteName: title, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#121310' },
  ],
}

const themeScript = `(function(){try{var t=localStorage.getItem('stc:theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

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
