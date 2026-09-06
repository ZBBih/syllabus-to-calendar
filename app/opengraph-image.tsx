import { ImageResponse } from 'next/og'

export const alt = 'Syllabify: drop your syllabi, get every deadline on your calendar'
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
          alignItems: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #fffaf0 0%, #fde68a 100%)',
          color: '#1c1917',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: 56,
            background: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 30px 60px -20px rgba(120,80,0,0.45)',
          }}
        >
          <svg width="200" height="200" viewBox="0 0 64 64">
            <rect x="12" y="16" width="40" height="36" rx="6" fill="#1c1917" />
            <rect x="12" y="22" width="40" height="4" fill="#f59e0b" opacity="0.35" />
            <rect x="20" y="10" width="5" height="12" rx="2.5" fill="#1c1917" />
            <rect x="39" y="10" width="5" height="12" rx="2.5" fill="#1c1917" />
            <path d="M23 38 L30 45 L42 31" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 64 }}>
          <div style={{ fontSize: 112, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>Syllabify</div>
          <div style={{ fontSize: 40, marginTop: 24, fontWeight: 600, maxWidth: 740, lineHeight: 1.25 }}>
            Drop your syllabi. Get every deadline on your calendar.
          </div>
          <div style={{ fontSize: 26, marginTop: 28, color: '#78716c' }}>No account. Nothing uploaded. Free.</div>
        </div>
      </div>
    ),
    size,
  )
}
