/**
 * A calendar page with a tick through it.
 *
 * The earlier mark carried a dark header band as well as the page, the rings and the tick,
 * which turned to mud at the 28px the header actually renders it at. The band is gone and
 * the tick is now the heaviest shape, so the silhouette survives being small.
 */
export function Logo({
  size = 40,
  className = "",
  animate = false,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {/* The two colours come from variables so a surface can swap them: on the green hero the
          square goes white and the page goes green, otherwise the square would vanish. */}
      <rect
        width="64"
        height="64"
        rx="16"
        fill="var(--logo-bg, var(--accent))"
      />
      <rect
        x="11"
        y="17"
        width="42"
        height="36"
        rx="7"
        fill="var(--logo-fg, var(--accent-ink))"
      />
      <rect
        x="19"
        y="9"
        width="6"
        height="14"
        rx="3"
        fill="var(--logo-fg, var(--accent-ink))"
      />
      <rect
        x="39"
        y="9"
        width="6"
        height="14"
        rx="3"
        fill="var(--logo-fg, var(--accent-ink))"
      />
      <g className={animate ? "draw-check" : undefined}>
        <path
          d="M21 36 L29 44 L44 26"
          fill="none"
          stroke="var(--logo-bg, var(--accent))"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
