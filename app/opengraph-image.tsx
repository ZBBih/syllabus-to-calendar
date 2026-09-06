import { ImageResponse } from 'next/og'

export const alt = 'Syllabify: every deadline on your calendar, without an account'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#fbfaf7',
          color: '#191813',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="15" fill="#1f5a4c" />
            <rect x="12" y="15" width="40" height="37" rx="7" fill="#fbfaf7" />
            <rect x="12" y="15" width="40" height="9" rx="7" fill="#163f36" />
            <rect x="12" y="20" width="40" height="4" fill="#163f36" />
            <rect x="20" y="9" width="5" height="11" rx="2.5" fill="#163f36" />
            <rect x="39" y="9" width="5" height="11" rx="2.5" fill="#163f36" />
            <path d="M22 37 L29 44 L43 30" fill="none" stroke="#1f5a4c" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 40, letterSpacing: -1 }}>Syllabify</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            Every deadline on your calendar before the first week is over.
          </div>
          <div style={{ fontSize: 32, marginTop: 28, color: '#6e6a60', fontFamily: 'sans-serif' }}>
            Drop your syllabi. Check what it found. Send it to your calendar.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, fontFamily: 'sans-serif', fontSize: 24 }}>
          {['No account', 'Nothing uploaded', 'No class limit', 'Free'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 10,
                background: '#e5efea',
                color: '#1f5a4c',
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
