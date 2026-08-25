type AyahMarkerProps = {
  number: number;
  size?: number;
  /** Lit state, used while this ayah is the one being recited. */
  active?: boolean;
  className?: string;
};

/**
 * The ayah number badge, drawn as the eight pointed rosette that marks verse
 * endings in a printed mushaf. This is the ornament doing its actual
 * historical job rather than decoration borrowed for its own sake.
 */
export function AyahMarker({
  number,
  size = 34,
  active = false,
  className,
}: AyahMarkerProps) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={`absolute inset-0 transition-colors duration-500 ${
          active ? "text-gold" : "text-line-strong"
        }`}
        aria-hidden="true"
      >
        <rect
          x="11"
          y="11"
          width="26"
          height="26"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="11"
          y="11"
          width="26"
          height="26"
          transform="rotate(45 24 24)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {active ? (
          <>
            {/* A steady wash behind the rosette, so the lit state reads even
                where motion is turned off. */}
            <circle cx="24" cy="24" r="17" fill="currentColor" opacity="0.13" />
            {/* And a broken ring turning around it while the ayah is read. */}
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="10 16"
              opacity="0.85"
              className="hd-turn"
            />
          </>
        ) : null}
      </svg>
      <span
        className={`relative font-kufi tabular-nums transition-colors duration-500 ${
          active ? "text-gold-ink" : "text-ink-dim"
        }`}
        style={{ fontSize: size * 0.32 }}
      >
        {number}
      </span>
    </span>
  );
}
