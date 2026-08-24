"use client";

import { useMemo } from "react";

import { AyahMarker } from "@/components/ornament/AyahMarker";
import { GirihRule } from "@/components/ornament/GirihRule";
import type { Ayah, JuzAyah } from "@/lib/quran";

type MushafAyah = Ayah &
  Partial<
    Pick<
      JuzAyah,
      "surahNumber" | "surahArabicName" | "surahEnglishName" | "startsSurah"
    >
  >;

type MushafViewProps = {
  ayahs: MushafAyah[];
  arabicSize: number;
  /** The ayah currently being recited, highlighted in place. */
  activeAyah: number | null;
  onSelect: (ayah: MushafAyah) => void;
  /** Set when reading a juz, so surah headings appear at each boundary. */
  showSurahHeadings?: boolean;
};

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

type Run = {
  key: string;
  surahNumber?: number;
  surahArabicName?: string;
  surahEnglishName?: string;
  heading: boolean;
  ayahs: MushafAyah[];
};

/**
 * Continuous reading.
 *
 * The study layout gives each ayah its own row, translation and row of
 * buttons, which suits studying a passage but makes reading any length feel
 * like working through flashcards. Here the Arabic runs together inside a
 * single flowing block the way a printed copy reads, with the rosette marking
 * each ending and everything else moved out of the flow behind a tap.
 *
 * Each ayah is still its own inline element rather than one concatenated
 * string, so recitation can highlight the current one and anchors still work.
 * Ayahs are grouped into runs that break only at a surah boundary, which is
 * what keeps the text genuinely continuous instead of stacked.
 */
export function MushafView({
  ayahs,
  arabicSize,
  activeAyah,
  onSelect,
  showSurahHeadings = false,
}: MushafViewProps) {
  const runs = useMemo<Run[]>(() => {
    const out: Run[] = [];
    for (const ayah of ayahs) {
      const boundary = showSurahHeadings && ayah.startsSurah;
      if (out.length === 0 || boundary) {
        out.push({
          key: `run-${ayah.globalNumber}`,
          surahNumber: ayah.surahNumber,
          surahArabicName: ayah.surahArabicName,
          surahEnglishName: ayah.surahEnglishName,
          heading: Boolean(boundary),
          ayahs: [ayah],
        });
      } else {
        out[out.length - 1].ayahs.push(ayah);
      }
    }
    return out;
  }, [ayahs, showSurahHeadings]);

  return (
    <div className="flex flex-col gap-10">
      {runs.map((run) => (
        <section key={run.key}>
          {run.heading ? (
            <header
              className="hd-card mb-8 px-6 py-7 text-center"
              id={`surah-${run.surahNumber}`}
            >
              <p className="font-kufi text-[0.62rem] uppercase tracking-[0.3em] text-ink-faint">
                Surah {run.surahNumber}
              </p>
              <h2
                dir="rtl"
                lang="ar"
                className="font-quran mt-3 text-3xl text-gold-ink"
              >
                {run.surahArabicName}
              </h2>
              <p className="font-kufi mt-2 text-lg text-ink">
                {run.surahEnglishName}
              </p>

              {/* At Tawbah is the one surah that does not open with it, and in
                  Al Fatihah it is ayah one so it is already in the flow. */}
              {run.surahNumber !== 9 && run.surahNumber !== 1 ? (
                <>
                  <GirihRule className="mx-auto mt-5 max-w-xs" compact />
                  <p
                    dir="rtl"
                    lang="ar"
                    className="font-quran mt-4 text-2xl text-ink"
                  >
                    {BISMILLAH}
                  </p>
                </>
              ) : null}
            </header>
          ) : null}

          {/* One paragraph per run. This is what makes the text flow rather
              than break into a stack of separate ayahs. */}
          <p
            dir="rtl"
            lang="ar"
            className="font-quran text-pretty text-ink"
            style={{ fontSize: `${arabicSize}px`, lineHeight: 2.45 }}
          >
            {run.ayahs.map((ayah) => {
              const isActive = activeAyah === ayah.globalNumber;
              return (
                <span
                  key={ayah.globalNumber}
                  id={`ayah-${ayah.numberInSurah}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(ayah)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(ayah);
                    }
                  }}
                  aria-label={`Ayah ${ayah.numberInSurah}`}
                  className={`scroll-mt-24 cursor-pointer rounded-[6px] transition-colors duration-500 ${
                    isActive
                      ? "bg-gold/15 text-gold-ink"
                      : "hover:bg-surface-2/70 focus-visible:bg-surface-2"
                  }`}
                >
                  {ayah.arabic}
                  <AyahMarker
                    number={ayah.numberInSurah}
                    size={arabicSize * 1.2}
                    active={isActive}
                    className="mx-1.5 align-middle"
                  />
                </span>
              );
            })}
          </p>
        </section>
      ))}
    </div>
  );
}
