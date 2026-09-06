import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d7a5c' }}>
        <svg width="132" height="132" viewBox="0 0 64 64">
          <rect x="11" y="17" width="42" height="36" rx="7" fill="#ffffff" />
          <rect x="19" y="9" width="6" height="14" rx="3" fill="#ffffff" />
          <rect x="39" y="9" width="6" height="14" rx="3" fill="#ffffff" />
          <path d="M21 36 L29 44 L44 26" fill="none" stroke="#0d7a5c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  )
}
