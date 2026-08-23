type GirihRuleProps = {
  className?: string;
  /** Shrinks the centre motif for tighter spaces such as card headers. */
  compact?: boolean;
};

/**
 * A section divider. Two tapering gold lines meeting at a small girih star,
 * the way a manuscript separates one passage from the next.
 */
export function GirihRule({ className, compact = false }: GirihRuleProps) {
  const star = compact ? 12 : 18;

  return (
    <div
      className={`flex items-center gap-3 ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="hd-rule flex-1" />
      <svg
        width={star}
        height={star}
        viewBox="0 0 24 24"
        fill="none"
        className="text-gold shrink-0"
      >
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          transform="rotate(45 12 12)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <span className="hd-rule flex-1" />
    </div>
  );
}
