"use client";

import { useRef, useState } from "react";

import { Counter } from "@/components/ui/Counter";
import { Popover } from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { ENGLISH_EDITIONS, URDU_EDITIONS } from "@/data/editions";
import {
  updateSettings,
  type ReadingMode,
  type Settings,
} from "@/lib/settings";
import { useLanguage } from "@/lib/i18n";

export function ReaderControls({ settings }: { settings: Settings }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);


  const patchQuran = (patch: Partial<Settings["quran"]>) =>
    updateSettings((current) => ({
      ...current,
      quran: { ...current.quran, ...patch },
    }));

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-all duration-300 hover:border-gold hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {t("reader.display")}
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        align="end"
        width={336}
        ariaLabel="Display options"
        className="p-4"
      >
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.26em] text-ink-faint">
            {t("reader.mode")}
          </p>
          <div
            className="mt-3 grid grid-cols-2 gap-1.5"
            role="group"
            aria-label="Reading mode"
          >
            {(
              [
                { key: "study", label: t("reader.study"), note: t("reader.studyNote") },
                { key: "mushaf", label: t("reader.mushaf"), note: t("reader.mushafNote") },
              ] as { key: ReadingMode; label: string; note: string }[]
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => patchQuran({ readingMode: option.key })}
                aria-pressed={settings.quran.readingMode === option.key}
                className={`rounded-[10px] border px-3 py-2 text-left transition-all duration-250 ${
                  settings.quran.readingMode === option.key
                    ? "border-gold bg-surface-2"
                    : "border-line hover:border-line-strong"
                }`}
              >
                <span className="block text-sm text-ink">{option.label}</span>
                <span className="block text-[0.66rem] text-ink-faint">
                  {option.note}
                </span>
              </button>
            ))}
          </div>

          <div className="hd-rule my-4" />

          <p className="text-[0.62rem] uppercase tracking-[0.26em] text-ink-faint">
            {t("reader.size")}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              dir="rtl"
              lang="ar"
              className="font-quran truncate text-gold-ink"
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
            {t("reader.translations")}
          </p>

          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{t("reader.english")}</span>
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
              <span className="text-sm text-ink">{t("reader.urdu")}</span>
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
      </Popover>
    </div>
  );
}
