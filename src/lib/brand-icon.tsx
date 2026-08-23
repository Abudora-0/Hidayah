import type { ReactElement } from "react";

export const BRAND_BACKGROUND = "#06231c";
export const BRAND_GOLD = "#d4af37";
export const BRAND_GOLD_SOFT = "#e9d08a";

/**
 * The girih mark, built from plain elements rather than SVG.
 *
 * Icons are rendered through Satori, which only implements a subset of CSS and
 * does not handle arbitrary SVG. Two overlapping squares, one rotated, produce
 * the same eight pointed interlace as the real logo.
 *
 * The mark occupies the middle 46 percent, which sits inside the safe area a
 * maskable icon needs, so the same art works for both purposes.
 */
export function BrandIcon({
  size,
  rounded = false,
}: {
  size: number;
  rounded?: boolean;
}): ReactElement {
  const square = Math.round(size * 0.46);
  const stroke = Math.max(2, Math.round(size * 0.055));
  const dot = Math.max(3, Math.round(size * 0.1));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: BRAND_BACKGROUND,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: square,
          height: square,
          border: `${stroke}px solid ${BRAND_GOLD}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: square,
          height: square,
          border: `${stroke}px solid ${BRAND_GOLD}`,
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: dot,
          height: dot,
          borderRadius: dot,
          background: BRAND_GOLD_SOFT,
        }}
      />
    </div>
  );
}
