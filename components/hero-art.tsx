/**
 * The landing illustration: a syllabus on the left, a calendar on the right, dates flying
 * across between them.
 *
 * It is a single inline SVG rather than an image so it inherits the theme colours, weighs
 * nothing, and stays sharp at any size. Every bit of the animation is CSS on classes defined
 * in globals.css, which is also where it all gets switched off for reduced motion.
 */

const PAPER_LINES = [
  { y: 40, w: 58 },
  { y: 52, w: 74 },
  { y: 64, w: 46 },
  { y: 76, w: 68 },
  { y: 88, w: 52 },
  { y: 100, w: 70 },
]

// Row, column, and the order it lights up in.
const FILLED: [number, number, number][] = [
  [0, 1, 0],
  [1, 3, 1],
  [2, 0, 2],
  [2, 4, 3],
  [3, 2, 4],
]

export function HeroArt({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 380 190"
      className={`hero-art w-full ${className}`}
      role="img"
      aria-label="A syllabus on the left, its dates flying across into a calendar on the right"
    >
      {/* The syllabus */}
      <g className="art-paper">
        <rect x="14" y="20" width="104" height="150" rx="8" fill="var(--elev)" stroke="var(--line-strong)" strokeWidth="1.5" />
        <rect x="28" y="34" width="42" height="7" rx="3.5" fill="var(--accent)" />
        {PAPER_LINES.map((l, i) => (
          <rect key={l.y} x="28" y={l.y + 12} width={l.w} height="5" rx="2.5" fill="var(--line-strong)" className="art-line" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
        <rect x="28" y="132" width="34" height="5" rx="2.5" fill="var(--accent)" opacity="0.55" />
        <rect x="28" y="144" width="52" height="5" rx="2.5" fill="var(--line-strong)" />
      </g>

      {/* Dates in transit */}
      <g className="art-flight">
        {[0, 1, 2].map((i) => (
          <g key={i} className="art-chip" style={{ animationDelay: `${400 + i * 520}ms` }}>
            <rect x="126" y="82" width="44" height="20" rx="6" fill="var(--accent)" />
            <rect x="133" y="89" width="18" height="3" rx="1.5" fill="var(--accent-ink)" opacity="0.9" />
            <rect x="155" y="89" width="8" height="3" rx="1.5" fill="var(--accent-ink)" opacity="0.6" />
            <rect x="133" y="95" width="26" height="3" rx="1.5" fill="var(--accent-ink)" opacity="0.55" />
          </g>
        ))}
      </g>

      {/* The calendar */}
      <g className="art-cal">
        <rect x="234" y="26" width="132" height="138" rx="10" fill="var(--elev)" stroke="var(--line-strong)" strokeWidth="1.5" />
        <path d="M234 36a10 10 0 0 1 10-10h112a10 10 0 0 1 10 10v18H234z" fill="var(--accent)" />
        <rect x="256" y="16" width="8" height="20" rx="4" fill="var(--accent-strong)" />
        <rect x="336" y="16" width="8" height="20" rx="4" fill="var(--accent-strong)" />
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => {
            const hit = FILLED.find(([r, c]) => r === row && c === col)
            const x = 246 + col * 23
            const y = 66 + row * 23
            return (
              <g key={`${row}-${col}`}>
                <rect x={x} y={y} width="17" height="17" rx="4" fill="var(--sunk)" />
                {hit && (
                  <rect
                    x={x}
                    y={y}
                    width="17"
                    height="17"
                    rx="4"
                    fill="var(--accent)"
                    className="art-cell"
                    style={{ animationDelay: `${900 + hit[2] * 260}ms` }}
                  />
                )}
              </g>
            )
          }),
        )}
      </g>
    </svg>
  )
}
