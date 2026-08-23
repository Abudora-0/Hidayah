"use client";

import { useEffect, useRef, useState } from "react";

import { Counter } from "@/components/ui/Counter";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { ENGLISH_EDITIONS, URDU_EDITIONS } from "@/data/editions";
import { updateSettings, type Settings } from "@/lib/settings";

export function ReaderControls({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const patchQuran = (patch: Partial<Settings["quran"]>) =>
    updateSettings((current) => ({
      ...current,
      quran: { ...current.quran, ...patch },
    }));

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-all duration-300 hover:border-gold hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Display
      </button>

      {open ? (
        <div className="hd-fade-up absolute right-0 top-12 z-50 w-[21rem] rounded-[14px] border border-line bg-surface-1 p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.26em] text-ink-faint">
            Reading size
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              dir="rtl"
              lang="ar"
              className="font-quran truncate text-gold-soft"
              style={{ fontSize: `${Math.min(settings.quran.arabicSize, 34)}px` }}
            >
              بِسْمِ ٱللَّهِ
            </span>
            <Counter
              value={settings.quran.arabicSize}
              onChange={(next) => patchQuran({ arabicSize: next })}
              min={20}
              max={56}
              step={2}
              label="Arabic reading size"
              suffix="px"
            />
          </div>

          <div className="hd-rule my-4" />

          <p className="text-[0.62rem] uppercase tracking-[0.26em] text-ink-faint">
            Translations
          </p>

          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">English</span>
              <Toggle
                size="sm"
                checked={settings.quran.showEnglish}
                onChange={(next) => patchQuran({ showEnglish: next })}
                label="Show the English translation"
              />
            </div>

            {settings.quran.showEnglish ? (
              <Select
                value={settings.quran.englishEdition}
                onChange={(id) => patchQuran({ englishEdition: id })}
                label="Choose an English translation"
                options={ENGLISH_EDITIONS.map((edition) => ({
                  value: edition.id,
                  label: edition.name,
                  note: edition.note,
                }))}
              />
            ) : null}

            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-sm text-ink">Urdu</span>
              <Toggle
                size="sm"
                checked={settings.quran.showUrdu}
                onChange={(next) => patchQuran({ showUrdu: next })}
                label="Show the Urdu translation"
              />
            </div>

            {settings.quran.showUrdu ? (
              <Select
                value={settings.quran.urduEdition}
                onChange={(id) => patchQuran({ urduEdition: id })}
                label="Choose an Urdu translation"
                options={URDU_EDITIONS.map((edition) => ({
                  value: edition.id,
                  label: edition.name,
                  note: edition.note,
                  rtl: true,
                }))}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
