"use client";

import { useEffect } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import type { Ayah } from "@/lib/quran";
import { useLanguage } from "@/lib/i18n";

type AyahSheetProps = {
  ayah: (Ayah & { surahNumber?: number }) | null;
  surahNumber: number;
  surahName: string;
  englishEdition: string;
  urduEdition: string;
  isPlaying: boolean;
  isBookmarked: boolean;
  onPlay: () => void;
  onTafsir: () => void;
  onBookmark: () => void;
  onClose: () => void;
};

/**
 * What a tap on an ayah opens in Mushaf mode.
 *
 * Continuous reading only works if the translation and controls stay out of
 * the flow, so they live here instead, one ayah at a time and on demand.
 */
export function AyahSheet({
  ayah,
  surahNumber,
  surahName,
  englishEdition,
  urduEdition,
  isPlaying,
  isBookmarked,
  onPlay,
  onTafsir,
  onBookmark,
  onClose,
}: AyahSheetProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!ayah) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ayah, onClose]);

  if (!ayah) return null;

  const surah = ayah.surahNumber ?? surahNumber;
  const english = ayah.translations[englishEdition];
  const urdu = ayah.translations[urduEdition];

  return (
    <>
      <div
        className="fixed inset-0 z-scrim bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Ayah ${surah}:${ayah.numberInSurah}`}
        className="hd-fade-up fixed inset-x-0 bottom-0 z-drawer max-h-[76vh] overflow-y-auto rounded-t-[18px] border-t border-line bg-surface-1 pb-8"
      >
        <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />

          <div className="flex items-baseline justify-between gap-4">
            <p className="font-kufi text-sm text-gold-ink">
              {surahName} {surah}:{ayah.numberInSurah}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("ayah.close")}
              className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-dim transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p
            dir="rtl"
            lang="ar"
            className="font-quran mt-5 text-2xl leading-loose text-ink"
          >
            {ayah.arabic}
          </p>

          {english ? (
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-dim">
              {english}
            </p>
          ) : null}

          {urdu ? (
            <p dir="rtl" lang="ur" className="font-urdu mt-5 text-[1.05rem] text-ink-dim">
              {urdu}
            </p>
          ) : null}

          <GirihRule className="my-6" compact />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPlay}
              className="flex items-center gap-2 rounded-full border border-gold px-4 py-2 text-sm text-gold-ink transition-colors duration-300 hover:bg-gold/12"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                {isPlaying ? <path d="M8 5h3v14H8zM13 5h3v14h-3z" /> : <path d="M8 5.5v13l11-6.5z" />}
              </svg>
              {isPlaying ? t("ayah.pause") : t("ayah.play")}
            </button>

            <button
              type="button"
              onClick={onTafsir}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors duration-300 hover:border-gold hover:text-gold-ink"
            >
              {t("tafsir.title")}
            </button>

            <button
              type="button"
              onClick={onBookmark}
              aria-pressed={isBookmarked}
              className={`rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                isBookmarked
                  ? "border-gold text-gold-ink"
                  : "border-line text-ink-dim hover:border-gold hover:text-gold-ink"
              }`}
            >
              {isBookmarked ? t("ayah.bookmarked") : t("ayah.bookmark")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
