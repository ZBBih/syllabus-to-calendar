import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Syllabify: every deadline on your calendar, without an account'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The renderer cannot reach the network at build time, so both the illustration and the display
// face are read off disk. Without the font the heading falls back to a system sans, which is not
// the face the site uses and makes a shared link look like a different product. Both files sit
// under app/ so neither is served as a public asset.
const art = `data:image/png;base64,${readFileSync(join(process.cwd(), 'app', 'og-art.png')).toString('base64')}`
const display = readFileSync(join(process.cwd(), 'app', 'og-display.ttf'))

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 72px',
          background: '#fbfaf7',
          color: '#191813',
          fontFamily: 'Instrument Serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="46" height="46" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="16" fill="#0d7a5c" />
              <rect x="11" y="17" width="42" height="36" rx="7" fill="#ffffff" />
              <rect x="19" y="9" width="6" height="14" rx="3" fill="#ffffff" />
              <rect x="39" y="9" width="6" height="14" rx="3" fill="#ffffff" />
              <path d="M21 36 L29 44 L44 26" fill="none" stroke="#0d7a5c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontSize: 34, letterSpacing: -0.5 }}>Syllabify</div>
          </div>

          <div style={{ fontSize: 66, lineHeight: 1.04, letterSpacing: -2, marginTop: 26 }}>Your whole semester, on your calendar, in one minute.</div>

          <div style={{ display: 'flex', gap: 10, marginTop: 30, fontFamily: 'sans-serif', fontSize: 20 }}>
            {['No account', 'Nothing uploaded', 'Free'].map((t) => (
              <div key={t} style={{ display: 'flex', padding: '9px 16px', borderRadius: 9, background: '#ddf2ea', color: '#0d7a5c', fontWeight: 600 }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
          <img src={art} alt="" width={420} height={314} />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Instrument Serif', data: display, weight: 400, style: 'normal' }] },
  )
}
