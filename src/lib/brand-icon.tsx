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
  plate = true,
}: {
  size: number;
  rounded?: boolean;
  /**
   * Draw the solid background. Off for the browser tab icon, so the mark sits
   * on whatever the tab strip uses.
   *
   * It has to stay on for the Apple touch icon and the maskable icon: iOS
   * composites a transparent touch icon onto black, and a maskable icon is
   * required to fill its safe area edge to edge.
   */
  plate?: boolean;
}): ReactElement {
  // With a plate the mark sits inside the maskable safe area. Without one
  // there is no plate to carry visual mass, so it fills more of the frame or
  // it reads as a speck in a tab strip.
  const fill = plate ? 0.46 : 0.74;
  const square = Math.round(size * fill);
  const stroke = Math.max(2, Math.round(size * (plate ? 0.055 : 0.08)));
  const dot = Math.max(3, Math.round(size * (plate ? 0.1 : 0.15)));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: plate ? BRAND_BACKGROUND : "transparent",
        borderRadius: rounded && plate ? size * 0.22 : 0,
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
