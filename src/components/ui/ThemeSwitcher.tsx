"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { Popover } from "./Popover";

import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEMES,
  THEME_LABELS,
  THEME_STORAGE_KEY,
  THEME_SWATCHES,
  applyThemeChoice,
  isMode,
  isTheme,
  type Mode,
  type Theme,
} from "@/lib/theme";

function readStored<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return guard(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    readStored(THEME_STORAGE_KEY, isTheme, DEFAULT_THEME),
  );
  const [mode, setMode] = useState<Mode>(() =>
    readStored(MODE_STORAGE_KEY, isMode, DEFAULT_MODE),
  );
  const triggerRef = useRef<HTMLButtonElement>(null);

  // React's dev remount strips attributes it does not own from the html
  // element, wiping what the bootstrap script set. Re-applying before paint
  // keeps development matching production. This is a no-op in production.
  useLayoutEffect(() => {
    applyThemeChoice(theme, mode);
  }, [theme, mode]);

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing. The choice still
      // applies for this session, it just will not be remembered.
    }
  }, []);

  const applyMode = useCallback((next: Mode) => {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // See above.
    }
  }, []);


  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Change theme"
        className="group flex h-9 items-center gap-2 rounded-full border border-line px-3 transition-colors duration-300 hover:border-gold"
      >
        <span
          className="h-4 w-4 rounded-full border border-line-strong transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `conic-gradient(from 140deg, ${THEME_SWATCHES[theme].accent} 0deg 140deg, ${THEME_SWATCHES[theme].bg} 140deg 360deg)`,
          }}
        />
        <span className="hidden text-xs text-ink-dim sm:inline">
          {THEME_LABELS[theme].name}
        </span>
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        align="end"
        width={240}
        ariaLabel="Theme"
        className="p-3"
      >
        <div>
          <p className="px-1 pb-2 text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">
            Theme
          </p>

          <div className="flex flex-col gap-1">
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => applyTheme(option)}
                aria-pressed={theme === option}
                className={`flex items-center gap-3 rounded-[10px] border px-2.5 py-2 text-left transition-all duration-250 ${
                  theme === option
                    ? "border-gold bg-surface-2"
                    : "border-transparent hover:border-line hover:bg-surface-2"
                }`}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-md border border-line-strong"
                  style={{
                    background: `conic-gradient(from 140deg, ${THEME_SWATCHES[option].accent} 0deg 140deg, ${THEME_SWATCHES[option].bg} 140deg 360deg)`,
                  }}
                />
                <span className="flex flex-col">
                  <span className="text-sm text-ink">
                    {THEME_LABELS[option].name}
                  </span>
                  <span className="text-[0.68rem] text-ink-faint">
                    {THEME_LABELS[option].note}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="hd-rule my-3" />

          <p className="px-1 pb-2 text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">
            Mode
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(["dark", "light"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => applyMode(option)}
                aria-pressed={mode === option}
                className={`rounded-[10px] border px-3 py-1.5 text-xs capitalize transition-all duration-250 ${
                  mode === option
                    ? "border-gold bg-surface-2 text-gold-ink"
                    : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </Popover>
    </div>
  );
}
