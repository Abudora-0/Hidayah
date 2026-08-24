"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { AudioPlayer } from "./AudioPlayer";
import { AyahRow } from "./AyahRow";
import { AyahSheet } from "./AyahSheet";
import { MushafView } from "./MushafView";
import { ReaderControls } from "./ReaderControls";
import { TafsirPanel } from "./TafsirPanel";
import { updateSettings, useSettings } from "@/lib/settings";
import { isBookmarked, setLastRead, toggleBookmark, useReading } from "@/lib/reading";
import { ayahAudioUrl, type Juz, type JuzAyah } from "@/lib/quran";

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
  const settings = useSettings();
  const reading = useReading();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [sheetAyah, setSheetAyah] = useState<JuzAyah | null>(null);
  const [tafsir, setTafsir] = useState<JuzAyah | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const { englishEdition, urduEdition, showEnglish, showUrdu, readingMode } =
    settings.quran;
  const mushaf = readingMode === "mushaf";

  const current = activeIndex !== null ? juz.ayahs[activeIndex] : null;
  const src = current
    ? ayahAudioUrl(settings.quran.reciter, current.globalNumber)
    : undefined;

  const playAt = useCallback((index: number) => {
    setActiveIndex(index);
    setPlayerOpen(true);
    setPlaying(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.src = src;
    audio.load();
    if (playing) audio.play().catch(() => setPlaying(false));
  }, [src, playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing]);

  useEffect(() => {
    if (activeIndex === null || !playing) return;
    const ayah = juz.ayahs[activeIndex];
    document
      .getElementById(`ayah-${ayah.numberInSurah}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, playing, juz.ayahs]);

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
  }, [juz.number, mushaf, juz.ayahs.length]);

  const indexByGlobal = useMemo(() => {
    const map = new Map<number, number>();
    juz.ayahs.forEach((ayah, index) => map.set(ayah.globalNumber, index));
    return map;
  }, [juz.ayahs]);

  function onEnded() {
    if (repeat) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => setPlaying(false));
      }
      return;
    }
    if (activeIndex !== null && activeIndex < juz.ayahs.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setPlaying(false);
    }
  }

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

        {mushaf ? (
          <MushafView
            ayahs={juz.ayahs}
            arabicSize={settings.quran.arabicSize}
            activeAyah={current?.globalNumber ?? null}
            onSelect={(ayah) => setSheetAyah(ayah as JuzAyah)}
            showSurahHeadings
          />
        ) : (
          <div className="flex flex-col gap-2">
            {juz.ayahs.map((ayah, index) => (
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
                    if (activeIndex === index) setPlaying((p) => !p);
                    else playAt(index);
                  }}
                  onTafsir={() => setTafsir(ayah)}
                />
              </div>
            ))}
          </div>
        )}

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
        preload="none"
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <AudioPlayer
        visible={playerOpen}
        playing={playing}
        ayahNumber={current?.numberInSurah ?? 1}
        ayahCount={juz.ayahs.length}
        surahName={current?.surahEnglishName ?? `Para ${juz.number}`}
        reciterId={settings.quran.reciter}
        progress={progress}
        duration={duration}
        repeat={repeat}
        onToggle={() => setPlaying((p) => !p)}
        onPrevious={() => setActiveIndex((i) => Math.max(0, (i ?? 0) - 1))}
        onNext={() =>
          setActiveIndex((i) => Math.min(juz.ayahs.length - 1, (i ?? 0) + 1))
        }
        onSeek={(fraction) => {
          const audio = audioRef.current;
          if (!audio || !Number.isFinite(audio.duration)) return;
          audio.currentTime = audio.duration * fraction;
          setProgress(audio.currentTime);
        }}
        onReciter={(id) =>
          updateSettings((c) => ({ ...c, quran: { ...c.quran, reciter: id } }))
        }
        onRepeat={setRepeat}
        onClose={() => {
          setPlaying(false);
          setPlayerOpen(false);
        }}
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
          activeIndex === indexByGlobal.get(sheetAyah.globalNumber)
        }
        isBookmarked={
          sheetAyah
            ? isBookmarked(reading, sheetAyah.surahNumber, sheetAyah.numberInSurah)
            : false
        }
        onPlay={() => {
          if (!sheetAyah) return;
          const index = indexByGlobal.get(sheetAyah.globalNumber);
          if (index === undefined) return;
          if (activeIndex === index) setPlaying((p) => !p);
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
