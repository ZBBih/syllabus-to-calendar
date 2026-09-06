import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f5a4c' }}>
        <svg width="140" height="140" viewBox="0 0 64 64">
          <rect x="12" y="15" width="40" height="37" rx="7" fill="#fbfaf7" />
          <rect x="12" y="15" width="40" height="9" rx="7" fill="#163f36" />
          <rect x="12" y="20" width="40" height="4" fill="#163f36" />
          <rect x="20" y="9" width="5" height="11" rx="2.5" fill="#163f36" />
          <rect x="39" y="9" width="5" height="11" rx="2.5" fill="#163f36" />
          <path d="M22 37 L29 44 L43 30" fill="none" stroke="#1f5a4c" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  )
}
