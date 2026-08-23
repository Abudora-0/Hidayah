type LatticeProps = {
  className?: string;
  /** Tile edge in pixels. Larger reads as architecture, smaller as textile. */
  scale?: number;
  opacity?: number;
};

/**
 * A tiling girih lattice used as a faint engraved ground behind hero panels.
 * It is the same interlace as the logo, repeated, so the background and the
 * brand are literally the same geometry at different sizes.
 */
export function Lattice({
  className,
  scale = 68,
  opacity = 0.055,
}: LatticeProps) {
  const id = `lattice-${scale}`;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={id}
          width={scale}
          height={scale}
          patternUnits="userSpaceOnUse"
        >
          <g
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            transform={`scale(${scale / 64})`}
          >
            <rect x="18" y="18" width="28" height="28" />
            <rect x="18" y="18" width="28" height="28" transform="rotate(45 32 32)" />
            <rect x="0" y="0" width="64" height="64" opacity="0.5" />
            <circle cx="32" cy="32" r="2" fill="currentColor" stroke="none" />
            <circle cx="0" cy="0" r="2" fill="currentColor" stroke="none" />
            <circle cx="64" cy="0" r="2" fill="currentColor" stroke="none" />
            <circle cx="0" cy="64" r="2" fill="currentColor" stroke="none" />
            <circle cx="64" cy="64" r="2" fill="currentColor" stroke="none" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
