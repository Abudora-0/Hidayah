"use client";

import { useId } from "react";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type GirihCornerProps = {
  /** Which corner to sit in. The motif is rotated to face inward. */
  corner: Corner;
  /** Edge of the square the ornament occupies, in pixels. */
  size?: number;
  opacity?: number;
  className?: string;
};

/* Rotation that turns the shape drawn for the top left corner into each of
   the others, and where to pin it. */
const PLACEMENT: Record<Corner, { rotate: number; position: string }> = {
  "top-left": { rotate: 0, position: "left-0 top-0" },
  "top-right": { rotate: 90, position: "right-0 top-0" },
  "bottom-right": { rotate: 180, position: "right-0 bottom-0" },
  "bottom-left": { rotate: 270, position: "left-0 bottom-0" },
};

/**
 * A corner ornament, the way a manuscript page is cornered rather than framed.
 *
 * It is the same figure as the rule and the ground: two squares, one turned
 * through forty five degrees, so every ornament in the app is one shape at a
 * different size. Two arms run out from the star along the edges and fade,
 * which suggests a frame without drawing one.
 */
export function GirihCorner({
  corner,
  size = 44,
  opacity = 0.5,
  className,
}: GirihCornerProps) {
  const { rotate, position } = PLACEMENT[corner];
  // Every instance needs its own gradient id. Keying it by corner meant each
  // panel on a page emitted the same one, and a duplicate id is resolved to
  // whichever came first, so the ornaments were quietly sharing a definition.
  const fade = `girih-corner-${useId()}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      style={{ opacity, transform: `rotate(${rotate}deg)` }}
      className={`pointer-events-none absolute text-gold ${position} ${className ?? ""}`}
    >
      <defs>
        <linearGradient id={fade} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The two arms, running out along the edges and fading as they go. */}
      <path
        d="M14 5H34"
        stroke={`url(#${fade})`}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M5 14V34"
        stroke={`url(#${fade})`}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* The star itself, the same interlace as the rule and the ground. */}
      <rect
        x="5"
        y="5"
        width="9"
        height="9"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <rect
        x="5"
        y="5"
        width="9"
        height="9"
        transform="rotate(45 9.5 9.5)"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
