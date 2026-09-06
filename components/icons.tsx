/**
 * One stroked icon set at one weight. The page previously mixed real SVGs with typed glyphs
 * like the multiplication sign standing in for a close button, which is the single clearest
 * tell of an interface nobody drew on purpose.
 */

type Props = { size?: number; className?: string }

function Svg({ size = 16, className = '', children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const X = (p: Props) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

export const Trash = (p: Props) => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
)

export const Plus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const Check = (p: Props) => (
  <Svg {...p}>
    <path d="m20 6-11 11-5-5" />
  </Svg>
)

export const ArrowRight = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </Svg>
)

export const ArrowLeft = (p: Props) => (
  <Svg {...p}>
    <path d="M19 12H5M11 19l-7-7 7-7" />
  </Svg>
)

export const Upload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
  </Svg>
)

export const Doc = (p: Props) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Svg>
)

export const Camera = (p: Props) => (
  <Svg {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h2.5l1.2-2h6.6L16.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.4" />
  </Svg>
)

export const Lock = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
)

export const Infinite = (p: Props) => (
  <Svg {...p}>
    <path d="M6.2 8.6a3.4 3.4 0 1 0 0 6.8c3.4 0 4.2-6.8 7.6-6.8a3.4 3.4 0 1 1 0 6.8c-3.4 0-4.2-6.8-7.6-6.8z" />
  </Svg>
)

export const Chart = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
)

export const Chevron = ({ open = false, ...p }: Props & { open?: boolean }) => (
  <Svg {...p} className={`${p.className ?? ''} transition-transform ${open ? 'rotate-90' : ''}`}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
)

export const Swap = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </Svg>
)

export const Alert = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20z" />
    <path d="M12 10v4M12 17.5v.01" />
  </Svg>
)

export const Mail = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
)

export const Coffee = (p: Props) => (
  <Svg {...p}>
    <path d="M4 9h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M17 10h1.6a2.4 2.4 0 0 1 0 4.8H17" />
    <path d="M7 2.5v2M11 2.5v2" />
  </Svg>
)

/** Brand marks are filled, not stroked, so they get their own wrapper. */
function Brand({ size = 16, className = '', children }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {children}
    </svg>
  )
}

export const LinkedIn = (p: Props) => (
  <Brand {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3zM9.5 9.5h3.8v1.5h.06c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.76v5.69h-4v-5.05c0-1.2-.02-2.75-1.72-2.75-1.72 0-1.98 1.31-1.98 2.66v5.14h-4z" />
  </Brand>
)

export const Instagram = (p: Props) => (
  <Brand {...p}>
    <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.14 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17C2.4 10.11 2.4 10.46 2.4 12s.01 1.89.07 3.13c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.6.07 4.73.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.6.07-3.13s-.01-1.89-.07-3.13c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4C15.5 4.01 15.14 4 12 4z" />
    <path d="M12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 1.9a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z" />
    <circle cx="17.05" cy="6.95" r="1.15" />
  </Brand>
)
