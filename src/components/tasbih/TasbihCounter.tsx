"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";

type Dhikr = {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
  target: number;
};

/** The tasbih of Fatimah, the cycle prayed after each salah. */
const DHIKR: Dhikr[] = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ ٱللَّٰهِ",
    translit: "SubhanAllah",
    meaning: "Glory be to Allah",
    target: 33,
  },
  {
    id: "alhamdulillah",
    arabic: "ٱلْحَمْدُ لِلَّٰهِ",
    translit: "Alhamdulillah",
    meaning: "All praise is for Allah",
    target: 33,
  },
  {
    id: "allahuakbar",
    arabic: "ٱللَّٰهُ أَكْبَرُ",
    translit: "Allahu Akbar",
    meaning: "Allah is the greatest",
    target: 34,
  },
  {
    id: "istighfar",
    arabic: "أَسْتَغْفِرُ ٱللَّٰهَ",
    translit: "Astaghfirullah",
    meaning: "I seek forgiveness from Allah",
    target: 100,
  },
  {
    id: "salawat",
    arabic: "ٱللَّٰهُمَّ صَلِّ عَلَى مُحَمَّد",
    translit: "Salawat",
    meaning: "Blessings upon the Prophet",
    target: 100,
  },
];

const STORAGE_KEY = "hidayah-tasbih";

/* Counts live outside React, so a tap writes once and every reader updates. */
type Counts = Record<string, number>;

let cache: Counts | null = null;
const listeners = new Set<() => void>();

function read(): Counts {
  if (cache) return cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Counts) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Counts) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing. The count still holds for this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: Counts = {};

const SIZE = 260;
const R = 112;
const CIRC = 2 * Math.PI * R;

export function TasbihCounter() {
  const counts = useSyncExternalStore(subscribe, read, () => EMPTY);
  const [activeId, setActiveId] = useState(DHIKR[0].id);

  const dhikr = useMemo(
    () => DHIKR.find((d) => d.id === activeId) ?? DHIKR[0],
    [activeId],
  );

  const count = counts[dhikr.id] ?? 0;
  const complete = count > 0 && count % dhikr.target === 0;
  const withinCycle = count % dhikr.target;
  const progress = withinCycle === 0 && count > 0 ? 1 : withinCycle / dhikr.target;

  const tap = useCallback(() => {
    const next = { ...read(), [dhikr.id]: (read()[dhikr.id] ?? 0) + 1 };
    write(next);

    // A short pulse on completing a cycle, a tick otherwise. Silently ignored
    // where the browser does not support it, which includes desktop.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const done = next[dhikr.id] % dhikr.target === 0;
      navigator.vibrate(done ? [40, 60, 90] : 18);
    }
  }, [dhikr.id, dhikr.target]);

  const reset = useCallback(() => {
    write({ ...read(), [dhikr.id]: 0 });
  }, [dhikr.id]);

  // Space and Enter count too, so it works from a keyboard.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      }
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        tap();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tap]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full flex-wrap justify-center gap-2">
        {DHIKR.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveId(option.id)}
            aria-pressed={option.id === dhikr.id}
            className={`rounded-full border px-4 py-2 text-xs transition-all duration-300 ${
              option.id === dhikr.id
                ? "border-gold bg-gold/12 text-gold-ink"
                : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
            }`}
          >
            {option.translit}
            <span className="ml-2 tabular-nums text-ink-faint">
              {counts[option.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <GirihRule className="my-9 w-full max-w-sm" />

      <p dir="rtl" lang="ar" className="font-quran text-3xl text-gold-ink">
        {dhikr.arabic}
      </p>
      <p className="mt-2 text-sm text-ink-dim">{dhikr.meaning}</p>

      <button
        type="button"
        onClick={tap}
        aria-label={`Count ${dhikr.translit}. Currently ${count}.`}
        className="group relative mt-10 grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
        style={{ width: SIZE, height: SIZE }}
      >
        <span className="hd-halo pointer-events-none absolute -inset-4 rounded-full" aria-hidden="true" />

        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="currentColor" strokeWidth="6" className="text-line" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="text-gold transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>

        {/* The girih quarters, as on the prayer dial */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden="true">
          {[0, 90, 180, 270].map((angle) => (
            <rect
              key={angle}
              x={SIZE / 2 - 4}
              y={SIZE / 2 - R - 4}
              width="8"
              height="8"
              className={complete ? "text-gold" : "text-line-strong"}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              transform={`rotate(${angle} ${SIZE / 2} ${SIZE / 2}) rotate(45 ${SIZE / 2} ${SIZE / 2 - R})`}
            />
          ))}
        </svg>

        <span className="relative flex flex-col items-center">
          <span className="font-kufi text-6xl tabular-nums text-ink">{count}</span>
          <span className="mt-1 text-[0.66rem] uppercase tracking-[0.24em] text-ink-faint">
            {withinCycle === 0 && count > 0 ? dhikr.target : withinCycle} of {dhikr.target}
          </span>
        </span>
      </button>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-line px-4 py-2 text-xs text-ink-dim transition-colors duration-300 hover:border-gold hover:text-gold-ink"
        >
          Reset this dhikr
        </button>
        <span className="text-xs text-ink-faint">
          {Math.floor(count / dhikr.target)} full{" "}
          {Math.floor(count / dhikr.target) === 1 ? "round" : "rounds"}
        </span>
      </div>

      <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-ink-faint">
        Tap the circle, or press space. Counts are kept on this device and
        carry over between visits.
      </p>
    </div>
  );
}
