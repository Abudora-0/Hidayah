"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { AudioPlayer } from "./AudioPlayer";
import { AyahRow } from "./AyahRow";
import { AyahSheet } from "./AyahSheet";
import { MushafView } from "./MushafView";
import { ReaderControls } from "./ReaderControls";
import { ReaderPager } from "./ReaderPager";
import { TafsirPanel } from "./TafsirPanel";
import { updateSettings, useSettings } from "@/lib/settings";
import { useLanguage } from "@/lib/i18n";
import { isBookmarked, setLastRead, toggleBookmark, useReading } from "@/lib/reading";
import { PAGE_SIZE, useAyahPagination } from "@/lib/pagination";
import { useRecitation } from "@/lib/recitation";
import { type Juz, type JuzAyah } from "@/lib/quran";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

type JuzReaderProps = {
  juz: Juz;
  previous: number | null;
  next: number | null;
};

/**
 * Reading a whole para.
 *
 * A juz crosses surah boundaries, so this cannot reuse SurahReader directly:
 * ayah numbering restarts at each surah, headings have to appear mid stream,
 * and audio has to walk the flat list rather than count up to a surah length.
 */
export function JuzReader({ juz, previous, next }: JuzReaderProps) {
  const { t } = useLanguage();
  const settings = useSettings();
  const reading = useReading();
  const [sheetAyah, setSheetAyah] = useState<JuzAyah | null>(null);
  const [tafsir, setTafsir] = useState<JuzAyah | null>(null);

  const { englishEdition, urduEdition, showEnglish, showUrdu, readingMode } =
    settings.quran;
  const mushaf = readingMode === "mushaf";

  // A juz restarts ayah numbering at every surah, so an anchor has to be
  // matched against the ayah numbers actually present rather than assumed to
  // be an offset.
  const findIndexForAnchor = useCallback(
    (ayahNumber: number) =>
      juz.ayahs.findIndex((a) => a.numberInSurah === ayahNumber),
    [juz.ayahs],
  );

  const pageSize = mushaf ? PAGE_SIZE.mushaf : PAGE_SIZE.study;
  const paged = useAyahPagination(juz.ayahs, pageSize, findIndexForAnchor);

  const goToIndex = paged.goToIndex;

  const globalNumberAt = useCallback(
    (position: number) => juz.ayahs[position]?.globalNumber,
    [juz.ayahs],
  );

  const onIndexChange = useCallback(
    (position: number) => {
      goToIndex(position);
    },
    [goToIndex],
  );

  // The whole para plays straight through, and the page follows the reciting.
  const {
    audioRef,
    seekRef,
    elapsedRef,
    index: playingIndex,
    playing,
    visible: playerVisible,
    duration,
    rate,
    repeat,
    setRate,
    setRepeat,
    playAt,
    goTo,
    toggle: togglePlay,
    seek,
    close: closePlayer,
    onEnded,
    onDurationChange,
    onTimeUpdate,
    onPlay,
  } = useRecitation({
    count: juz.ayahs.length,
    globalNumberAt,
    reciterId: settings.quran.reciter,
    onIndexChange,
  });

  const activeIndex = playingIndex;
  const current = activeIndex !== null ? juz.ayahs[activeIndex] : null;

  // Keep the recited ayah on screen.
  useEffect(() => {
    if (activeIndex === null || !playing) return;
    const ayah = juz.ayahs[activeIndex];
    if (!ayah) return;
    document
      .getElementById(`ayah-${ayah.numberInSurah}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, playing, juz.ayahs, paged.page]);

  // Remember the position in this juz for the resume card.
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[id^="ayah-"]');
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const ayah = Number(visible.target.id.replace("ayah-", ""));
        if (!Number.isFinite(ayah)) return;
        setLastRead({
          kind: "juz",
          number: juz.number,
          ayah,
          label: `Juz ${juz.number}`,
        });
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [juz.number, mushaf, juz.ayahs.length, paged.page]);
  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <nav className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/quran?view=juz"
            className="flex items-center gap-2 text-sm text-ink-dim transition-colors duration-300 hover:text-gold-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All paras
          </Link>
          <ReaderControls settings={settings} />
        </nav>

        <header className="hd-card px-6 py-9 text-center sm:px-10">
          <p className="font-kufi text-[0.62rem] uppercase tracking-[0.34em] text-ink-faint">
            Para {juz.number} of 30
          </p>
          <h1 dir="rtl" lang="ar" className="font-quran mt-4 text-4xl text-gold-ink">
            الجزء {juz.number}
          </h1>
          <p className="mt-4 text-sm text-ink-dim">
            {juz.surahs.map((s) => s.englishName).join(", ")}
          </p>
          <p className="mt-1 text-xs text-ink-faint">{juz.ayahs.length} ayahs</p>
        </header>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => playAt(0)}
            className="flex items-center gap-2.5 rounded-full border border-gold px-5 py-2.5 text-sm text-gold-ink transition-all duration-300 hover:bg-gold/12"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
            Recite this para
          </button>
        </div>

        <GirihRule className="my-10" />

        <ReaderPager
          page={paged.page}
          pageCount={paged.pageCount}
          onPage={paged.setPage}
          rangeLabel={`Ayahs ${paged.offset + 1} to ${Math.min(paged.offset + pageSize, juz.ayahs.length)} of ${juz.ayahs.length}`}
        />

        <div className="mt-8">
        {mushaf ? (
          <MushafView
            ayahs={paged.items}
            arabicSize={settings.quran.arabicSize}
            activeAyah={current?.globalNumber ?? null}
            onSelect={(ayah) => setSheetAyah(ayah as JuzAyah)}
            showSurahHeadings
          />
        ) : (
          <div className="flex flex-col gap-2">
            {paged.items.map((ayah, pageIndex) => {
              const index = paged.offset + pageIndex;
              return (
              <div key={ayah.globalNumber}>
                {ayah.startsSurah ? (
                  <header className="hd-card mb-4 mt-8 px-6 py-6 text-center">
                    <p className="font-kufi text-[0.6rem] uppercase tracking-[0.3em] text-ink-faint">
                      Surah {ayah.surahNumber}
                    </p>
                    <h2 dir="rtl" lang="ar" className="font-quran mt-2 text-2xl text-gold-ink">
                      {ayah.surahArabicName}
                    </h2>
                    <p className="font-kufi mt-1 text-base text-ink">
                      {ayah.surahEnglishName}
                    </p>

                    {/* The bismillah is stripped from the opening ayah so it
                        is not printed twice, which means the heading has to
                        carry it. Al Fatihah keeps it as ayah one, and At
                        Tawbah does not open with it at all. */}
                    {ayah.surahNumber !== 1 && ayah.surahNumber !== 9 ? (
                      <p
                        dir="rtl"
                        lang="ar"
                        className="font-quran mt-4 text-xl text-ink"
                      >
                        {BISMILLAH}
                      </p>
                    ) : null}
                  </header>
                ) : null}

                <AyahRow
                  ayah={ayah}
                  surahNumber={ayah.surahNumber}
                  arabicSize={settings.quran.arabicSize}
                  englishEdition={englishEdition}
                  urduEdition={urduEdition}
                  showEnglish={showEnglish}
                  showUrdu={showUrdu}
                  isPlaying={playing && activeIndex === index}
                  onPlay={() => {
                    if (activeIndex === index) togglePlay();
                    else playAt(index);
                  }}
                  onTafsir={() => setTafsir(ayah)}
                />
              </div>
              );
            })}
          </div>
        )}
        </div>

        <GirihRule className="my-10" />

        <ReaderPager
          page={paged.page}
          pageCount={paged.pageCount}
          onPage={paged.setPage}
          rangeLabel={`Ayahs ${paged.offset + 1} to ${Math.min(paged.offset + pageSize, juz.ayahs.length)} of ${juz.ayahs.length}`}
        />

        <GirihRule className="my-10" />

        <nav className="flex items-stretch justify-between gap-3 pb-24">
          {previous ? (
            <Link href={`/quran/juz/${previous}`} className="hd-card hd-lift flex flex-1 items-center gap-3 p-4">
              <span className="text-gold" aria-hidden="true">&#8592;</span>
              <span>
                <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-ink-faint">Previous</span>
                <span className="block font-kufi text-sm text-ink">Para {previous}</span>
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}

          {next ? (
            <Link href={`/quran/juz/${next}`} className="hd-card hd-lift flex flex-1 items-center justify-end gap-3 p-4 text-right">
              <span>
                <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-ink-faint">Next</span>
                <span className="block font-kufi text-sm text-ink">Para {next}</span>
              </span>
              <span className="text-gold" aria-hidden="true">&#8594;</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      </div>

      <audio
        ref={audioRef}
        preload="auto"
        onEnded={onEnded}
        onPlay={onPlay}
        onTimeUpdate={onTimeUpdate}
        onDurationChange={(event) =>
          onDurationChange(event.currentTarget.duration)
        }
      />

      <AudioPlayer
        visible={playerVisible}
        playing={playing}
        ayahLabel={`${t("quran.ayah")} ${current?.numberInSurah ?? 1}`}
        surahName={current?.surahEnglishName ?? `${t("quran.para")} ${juz.number}`}
        reciterId={settings.quran.reciter}
        duration={duration}
        repeat={repeat}
        rate={rate}
        atStart={(playingIndex ?? 0) <= 0}
        atEnd={(playingIndex ?? 0) >= juz.ayahs.length - 1}
        seekRef={seekRef}
        elapsedRef={elapsedRef}
        onToggle={togglePlay}
        onPrevious={() => goTo((playingIndex ?? 0) - 1)}
        onNext={() => goTo((playingIndex ?? 0) + 1)}
        onSeek={seek}
        onReciter={(id) =>
          updateSettings((c) => ({ ...c, quran: { ...c.quran, reciter: id } }))
        }
        onRepeat={setRepeat}
        onRate={setRate}
        onClose={closePlayer}
      />

      <AyahSheet
        ayah={sheetAyah}
        surahNumber={sheetAyah?.surahNumber ?? 1}
        surahName={sheetAyah?.surahEnglishName ?? ""}
        englishEdition={englishEdition}
        urduEdition={urduEdition}
        isPlaying={
          playing &&
          sheetAyah !== null &&
          activeIndex === juz.ayahs.findIndex(
            (a) => a.globalNumber === sheetAyah.globalNumber,
          )
        }
        isBookmarked={
          sheetAyah
            ? isBookmarked(reading, sheetAyah.surahNumber, sheetAyah.numberInSurah)
            : false
        }
        onPlay={() => {
          if (!sheetAyah) return;
          const index = juz.ayahs.findIndex(
            (a) => a.globalNumber === sheetAyah.globalNumber,
          );
          if (index < 0) return;
          if (activeIndex === index) togglePlay();
          else playAt(index);
        }}
        onTafsir={() => {
          setTafsir(sheetAyah);
          setSheetAyah(null);
        }}
        onBookmark={() => {
          if (!sheetAyah) return;
          toggleBookmark(
            sheetAyah.surahNumber,
            sheetAyah.numberInSurah,
            `${sheetAyah.surahEnglishName} ${sheetAyah.surahNumber}:${sheetAyah.numberInSurah}`,
          );
        }}
        onClose={() => setSheetAyah(null)}
      />

      <TafsirPanel
        open={tafsir !== null}
        surahNumber={tafsir?.surahNumber ?? 1}
        surahName={tafsir?.surahEnglishName ?? ""}
        ayahNumber={tafsir?.numberInSurah ?? null}
        editionId={settings.quran.tafsirEdition}
        onEdition={(id) =>
          updateSettings((c) => ({ ...c, quran: { ...c.quran, tafsirEdition: id } }))
        }
        onClose={() => setTafsir(null)}
      />
    </div>
  );
}
