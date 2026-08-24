export const THEMES = ["emerald", "lapis", "ink"] as const;
export const MODES = ["dark", "light"] as const;

export type Theme = (typeof THEMES)[number];
export type Mode = (typeof MODES)[number];

export const DEFAULT_THEME: Theme = "ink";
export const DEFAULT_MODE: Mode = "dark";

export const THEME_STORAGE_KEY = "hidayah-theme";
export const MODE_STORAGE_KEY = "hidayah-mode";

export const THEME_LABELS: Record<Theme, { name: string; note: string }> = {
  emerald: { name: "Emerald", note: "Deep green and gold" },
  lapis: { name: "Lapis", note: "Midnight blue and gold" },
  ink: { name: "Ink", note: "Charcoal and brass" },
};

/**
 * A swatch pair for each theme, used by the theme switcher so the choice can
 * be seen rather than read. These mirror the dark token set in globals.css.
 */
export const THEME_SWATCHES: Record<Theme, { bg: string; accent: string }> = {
  emerald: { bg: "#06231c", accent: "#d4af37" },
  lapis: { bg: "#0b1a2f", accent: "#c9a227" },
  ink: { bg: "#121212", accent: "#b08d57" },
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

/**
 * Runs synchronously in the document head, before the browser paints, so the
 * stored theme is already on the html element when the first pixels land.
 * Without this the page would flash the default theme on every load.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${THEME_STORAGE_KEY}");var m=localStorage.getItem("${MODE_STORAGE_KEY}");d.setAttribute("data-theme",t||"${DEFAULT_THEME}");d.setAttribute("data-mode",m||"${DEFAULT_MODE}")}catch(e){}})()`;

/**
 * Swaps the theme attributes with every CSS transition suppressed for one
 * frame.
 *
 * This is not a cosmetic choice. Chrome does not reliably invalidate a
 * property that is mid transition when the custom property feeding its value
 * changes, so switching theme left backgrounds and text painted in the
 * previous palette until something else forced a repaint. Committing the new
 * values with transitions off sidesteps that entirely, and has the pleasant
 * side effect that a theme change reads as instant rather than as a smear.
 */
export function applyThemeChoice(theme: Theme, mode: Mode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const suppress = document.createElement("style");
  suppress.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none !important}"),
  );
  document.head.appendChild(suppress);

  root.setAttribute("data-theme", theme);
  root.setAttribute("data-mode", mode);

  // Reading a layout value forces the new colours to be committed while the
  // suppression rule is still in the document.
  void window.getComputedStyle(document.body).backgroundColor;

  window.requestAnimationFrame(() => suppress.remove());
}
