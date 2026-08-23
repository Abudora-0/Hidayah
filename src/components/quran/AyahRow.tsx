"use client";

import { memo, useState } from "react";

import { AyahMarker } from "@/components/ornament/AyahMarker";
import type { Ayah } from "@/lib/quran";

type AyahRowProps = {
  ayah: Ayah;
  surahNumber: number;
  arabicSize: number;
  englishEdition: string;
  urduEdition: string;
  showEnglish: boolean;
  showUrdu: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onTafsir: () => void;
};

function IconButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-300 ${
        active
          ? "border-gold text-gold"
          : "border-transparent text-ink-faint hover:border-line hover:text-gold-ink"
      }`}
    >
      {children}
    </button>
  );
}

function AyahRowInner({
  ayah,
  surahNumber,
  arabicSize,
  englishEdition,
  urduEdition,
  showEnglish,
  showUrdu,
  isPlaying,
  onPlay,
  onTafsir,
}: AyahRowProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const parts = [ayah.arabic];
    if (showEnglish && ayah.translations[englishEdition]) {
      parts.push(ayah.translations[englishEdition]);
    }
    if (showUrdu && ayah.translations[urduEdition]) {
      parts.push(ayah.translations[urduEdition]);
    }
    parts.push(`Quran ${surahNumber}:${ayah.numberInSurah}`);

    try {
      await navigator.clipboard.writeText(parts.join("\n\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be blocked. Nothing useful to say here.
    }
  }

  return (
    <article
      id={`ayah-${ayah.numberInSurah}`}
      className={`group relative scroll-mt-24 rounded-[14px] border px-4 py-6 transition-all duration-500 sm:px-6 ${
        isPlaying
          ? "border-gold bg-surface-1"
          : "border-transparent hover:border-line hover:bg-surface-1/50"
      }`}
    >
      <div className="flex items-start gap-4">
        <AyahMarker number={ayah.numberInSurah} active={isPlaying} />

        <div className="min-w-0 flex-1">
          <p
            dir="rtl"
            lang="ar"
            className={`font-quran text-ink transition-colors duration-500 ${
              isPlaying ? "text-gold-ink" : ""
            }`}
            style={{ fontSize: `${arabicSize}px` }}
          >
            {ayah.arabic}
          </p>

          {showEnglish && ayah.translations[englishEdition] ? (
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-dim">
              {ayah.translations[englishEdition]}
            </p>
          ) : null}

          {showUrdu && ayah.translations[urduEdition] ? (
            <p
              dir="rtl"
              lang="ur"
              className="font-urdu mt-5 text-[1.05rem] text-ink-dim"
            >
              {ayah.translations[urduEdition]}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-1 opacity-60 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
            <IconButton
              label={isPlaying ? "Playing this ayah" : "Play this ayah"}
              onClick={onPlay}
              active={isPlaying}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                {isPlaying ? (
                  <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
                ) : (
                  <path d="M8 5.5v13l11-6.5z" />
                )}
              </svg>
            </IconButton>

            <IconButton label="Read the tafsir" onClick={onTafsir}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>

            <IconButton label={copied ? "Copied" : "Copy this ayah"} onClick={copy} active={copied}>
              {copied ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </IconButton>

            <span className="ml-auto text-[0.66rem] tabular-nums text-ink-faint">
              {surahNumber}:{ayah.numberInSurah}
              {ayah.sajda ? (
                <span className="ml-2 text-gold-ink" title="Verse of prostration">
                  sajdah
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export const AyahRow = memo(AyahRowInner);
