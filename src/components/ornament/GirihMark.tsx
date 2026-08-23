type GirihMarkProps = {
  size?: number;
  className?: string;
  /** Draws the interlace on first paint instead of showing it immediately. */
  animated?: boolean;
  /** The outer square frame. Dropped in the compact favicon sized variant. */
  frame?: boolean;
  title?: string;
};

/**
 * The Hidayah mark. An outlined girih interlace star held inside a square
 * frame, the same strapwork geometry that runs through the rest of the
 * interface. Strokes use currentColor so the mark follows the active theme.
 */
export function GirihMark({
  size = 40,
  className,
  animated = false,
  frame = true,
  title,
}: GirihMarkProps) {
  const drawClass = animated ? "hd-draw" : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}

      {frame ? (
        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.5"
          className={drawClass}
          style={{ ["--draw-length" as string]: "200" }}
        />
      ) : null}

      <rect
        x="17"
        y="17"
        width="30"
        height="30"
        stroke="currentColor"
        strokeWidth="2.6"
        className={drawClass}
        style={{ ["--draw-length" as string]: "128" }}
      />
      <rect
        x="17"
        y="17"
        width="30"
        height="30"
        transform="rotate(45 32 32)"
        stroke="currentColor"
        strokeWidth="2.6"
        className={drawClass}
        style={{ ["--draw-length" as string]: "128" }}
      />

      <circle cx="32" cy="32" r="3.4" fill="currentColor" />
    </svg>
  );
}
