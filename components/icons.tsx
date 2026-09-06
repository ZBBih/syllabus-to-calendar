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
