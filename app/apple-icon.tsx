import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f59e0b' }}>
        <svg width="140" height="140" viewBox="0 0 64 64">
          <rect x="12" y="16" width="40" height="36" rx="6" fill="#1c1917" />
          <rect x="12" y="22" width="40" height="4" fill="#f59e0b" opacity="0.35" />
          <rect x="20" y="10" width="5" height="12" rx="2.5" fill="#1c1917" />
          <rect x="39" y="10" width="5" height="12" rx="2.5" fill="#1c1917" />
          <path d="M23 38 L30 45 L42 31" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  )
}
