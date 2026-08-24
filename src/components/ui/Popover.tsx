"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { useMounted } from "@/lib/hooks";

type Align = "start" | "center" | "end";

type PopoverProps = {
  open: boolean;
  onClose: () => void;
  /** The element the panel is positioned against. */
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  /** Horizontal alignment relative to the anchor. */
  align?: Align;
  /** Panel width in pixels, or "anchor" to match the trigger. */
  width?: number | "anchor";
  className?: string;
  role?: "listbox" | "dialog" | "menu";
  id?: string;
  ariaLabel?: string;
};

const GAP = 6;
const EDGE = 8;

/**
 * A panel that escapes its parent.
 *
 * Dropdowns rendered inside the layout hit two problems. Any ancestor with a
 * transform, filter or containment creates a stacking context that traps them
 * regardless of z-index, and any ancestor with overflow hidden clips them. So
 * the panel is portalled to the body and positioned from the anchor's own
 * rectangle instead.
 *
 * It also flips above the anchor when there is not enough room below, which
 * the previous fixed "open downward" behaviour did not do, leaving panels
 * opened near the fold running off the bottom of the screen.
 *
 * Geometry is written straight to the node rather than held in state. The
 * position is derived from the DOM, so keeping a copy in React would mean a
 * re-render on every scroll frame for a value React does not own.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  align = "start",
  width = "anchor",
  className,
  role = "dialog",
  id,
  ariaLabel,
}: PopoverProps) {
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const rect = anchor.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    const panelWidth =
      width === "anchor" ? rect.width : Math.min(width, viewportW - EDGE * 2);

    // Width has to be applied before measuring height, since a narrower panel
    // wraps its content taller.
    panel.style.width = `${panelWidth}px`;

    const needed = panel.scrollHeight;
    const roomBelow = viewportH - rect.bottom - GAP - EDGE;
    const roomAbove = rect.top - GAP - EDGE;

    // Flip only when below genuinely cannot hold it and above is roomier.
    const placeAbove = needed > roomBelow && roomAbove > roomBelow;
    const maxHeight = Math.max(140, placeAbove ? roomAbove : roomBelow);

    let left = rect.left;
    if (align === "center") left = rect.left + rect.width / 2 - panelWidth / 2;
    if (align === "end") left = rect.right - panelWidth;
    left = Math.min(Math.max(EDGE, left), viewportW - panelWidth - EDGE);

    const top = placeAbove
      ? Math.max(EDGE, rect.top - GAP - Math.min(needed, maxHeight))
      : rect.bottom + GAP;

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.maxHeight = `${maxHeight}px`;
    panel.style.visibility = "visible";
  }, [anchorRef, align, width]);

  // Measured before paint, so the panel is never briefly visible in the wrong
  // place.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    // Capture phase, so scrolling inside any nested container repositions too.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, place, onClose, anchorRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      id={id}
      aria-label={ariaLabel}
      className={`hd-fade-up fixed z-popover overflow-y-auto rounded-[12px] border border-line bg-surface-1 ${className ?? ""}`}
      // Hidden until the layout effect has measured it.
      style={{ top: 0, left: 0, visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body,
  );
}
