"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { SurahOpening } from "@/components/ornament/SurahOpening";
import { AudioPlayer } from "./AudioPlayer";
import { AyahRow } from "./AyahRow";
import { AyahSheet } from "./AyahSheet";
import { MushafView } from "./MushafView";
import { ReaderControls } from "./ReaderControls";
import { TafsirPanel } from "./TafsirPanel";
import { updateSettings, useSettings } from "@/lib/settings";
import {
  isBookmarked,
  setLastRead,
  toggleBookmark,
  useReading,
} from "@/lib/reading";
import { ayahAudioUrl, type Ayah, type Surah } from "@/lib/quran";

type SurahReaderProps = {
  surah: Surah;
  /** Editions the server already loaded, so we know what is missing. */
  loadedEditions: string[];
  previous: { number: number; name: string } | null;
  next: { number: number; name: string } | null;
};

type ExtraTranslations = Record<string, Record<number, string>>;

/** Fetches one translation edition for a surah, straight from the open API. */
async function fetchEdition(surahNumber: number, editionId: string) {
  const res = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/${editionId}`,
  );
  if (!res.ok) throw new Error(`Edition unavailable (${res.status})`);
  const body = (await res.json()) as {
    data: { ayahs: { numberInSurah: number; text: string }[] };
  };

  const map: Record<number, string> = {};
  for (const ayah of body.data.ayahs) map[ayah.numberInSurah] = ayah.text;
  return map;
}

export function SurahReader({
  surah,
  loadedEditions,
  previous,
  next,
}: SurahReaderProps) {
  const settings = useSettings();
  const [extra, setExtra] = useState<ExtraTranslations>({});
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [sheetAyah, setSheetAyah] = useState<Ayah | null>(null);
  const reading = useReading();

  const audioRef = useRef<HTMLAudioElement>(null);

  const { englishEdition, urduEdition, showEnglish, showUrdu, readingMode } =
    settings.quran;
  const mushaf = readingMode === "mushaf";

  // Any edition the server did not preload is fetched on demand and merged in.
  useEffect(() => {
    const wanted: string[] = [];
    if (showEnglish && !loadedEditions.includes(englishEdition)) {
      wanted.push(englishEdition);
    }
    if (showUrdu && !loadedEditions.includes(urduEdition)) {
      wanted.push(urduEdition);
    }

    const missing = wanted.filter((id) => !(id in extra));
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map(async (id) => [id, await fetchEdition(surah.number, id)] as const),
    )
      .then((pairs) => {
        if (cancelled) return;
        setExtra((current) => {
          const merged = { ...current };
          for (const [id, map] of pairs) merged[id] = map;
          return merged;
        });
      })
      .catch(() => {
        // The reader still shows Arabic and whatever else loaded.
      });

    return () => {
      cancelled = true;
    };
  }, [
    showEnglish,
    showUrdu,
    englishEdition,
    urduEdition,
    loadedEditions,
    surah.number,
    extra,
  ]);

  // Merge server loaded translations with anything fetched since.
  const ayahs = useMemo(() => {
    if (Object.keys(extra).length === 0) return surah.ayahs;
    return surah.ayahs.map((ayah) => {
      const translations = { ...ayah.translations };
      for (const [id, map] of Object.entries(extra)) {
        const text = map[ayah.numberInSurah];
        if (text) translations[id] = text;
      }
      return { ...ayah, translations };
    });
  }, [surah.ayahs, extra]);

  const playAyah = useCallback(
    (numberInSurah: number) => {
      setActiveAyah(numberInSurah);
      setPlayerOpen(true);
      setPlaying(true);
    },
    [],
  );

  const currentAyah = activeAyah
    ? ayahs.find((a) => a.numberInSurah === activeAyah)
    : null;

  const src = currentAyah
    ? ayahAudioUrl(settings.quran.reciter, currentAyah.globalNumber)
    : undefined;

  // Load and play whenever the ayah or the reciter changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.src = src;
    audio.load();
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    }
  }, [src, playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing]);

  // Keep the recited ayah in view without yanking the page around.
  useEffect(() => {
    if (!activeAyah || !playing) return;
    const node = document.getElementById(`ayah-${activeAyah}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeAyah, playing]);

  function onEnded() {
    if (repeat) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => setPlaying(false));
      }
      return;
    }
    // Continuous recitation through to the end of the surah.
    if (activeAyah !== null && activeAyah < surah.ayahCount) {
      setActiveAyah(activeAyah + 1);
    } else {
      setPlaying(false);
    }
  }

  // Record where the reader has got to, so the resume card can offer it back.
  // The topmost ayah intersecting the viewport is the one being read.
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[id^="ayah-"]');
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;

        const ayah = Number(visible.target.id.replace("ayah-", ""));
        if (!Number.isFinite(ayah)) return;

        setLastRead({
          kind: "surah",
          number: surah.number,
          ayah,
          label: `${surah.englishName} ${surah.number}:${ayah}`,
        });
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [surah.number, surah.englishName, mushaf, ayahs.length]);

  function seek(fraction: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = audio.duration * fraction;
    setProgress(audio.currentTime);
  }

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <nav className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/quran"
            className="flex items-center gap-2 text-sm text-ink-dim transition-colors duration-300 hover:text-gold-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="m14 6-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            All surahs
          </Link>

          <ReaderControls settings={settings} />
        </nav>

        <SurahOpening
          number={surah.number}
          arabicName={surah.arabicName}
          englishName={surah.englishName}
          translatedName={surah.translatedName}
          ayahCount={surah.ayahCount}
          revelation={surah.revelation}
          showBismillah={surah.hasBismillah && surah.number !== 1}
        />

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => playAyah(1)}
            className="flex items-center gap-2.5 rounded-full border border-gold px-5 py-2.5 text-sm text-gold-ink transition-all duration-300 hover:bg-gold/12"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
            Recite this surah
          </button>
        </div>

        <GirihRule className="my-10" />

        {mushaf ? (
          <MushafView
            ayahs={ayahs}
            arabicSize={settings.quran.arabicSize}
            activeAyah={
              activeAyah
                ? (ayahs.find((a) => a.numberInSurah === activeAyah)
                    ?.globalNumber ?? null)
                : null
            }
            onSelect={(ayah) => setSheetAyah(ayah as Ayah)}
          />
        ) : (
        <div className="flex flex-col gap-2">
          {ayahs.map((ayah) => (
            <AyahRow
              key={ayah.numberInSurah}
              ayah={ayah}
              surahNumber={surah.number}
              arabicSize={settings.quran.arabicSize}
              englishEdition={englishEdition}
              urduEdition={urduEdition}
              showEnglish={showEnglish}
              showUrdu={showUrdu}
              isPlaying={playing && activeAyah === ayah.numberInSurah}
              onPlay={() => {
                if (activeAyah === ayah.numberInSurah) setPlaying((p) => !p);
                else playAyah(ayah.numberInSurah);
              }}
              onTafsir={() => setTafsirAyah(ayah.numberInSurah)}
            />
          ))}
        </div>
        )}

        <GirihRule className="my-10" />

        <nav className="flex items-stretch justify-between gap-3 pb-24">
          {previous ? (
            <Link
              href={`/quran/${previous.number}`}
              className="hd-card hd-lift flex flex-1 items-center gap-3 p-4"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold" fill="none" aria-hidden="true">
                <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0">
                <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-ink-faint">
                  Previous
                </span>
                <span className="block truncate font-kufi text-sm text-ink">
                  {previous.name}
                </span>
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}

          {next ? (
            <Link
              href={`/quran/${next.number}`}
              className="hd-card hd-lift flex flex-1 items-center justify-end gap-3 p-4 text-right"
            >
              <span className="min-w-0">
                <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-ink-faint">
                  Next
                </span>
                <span className="block truncate font-kufi text-sm text-ink">
                  {next.name}
                </span>
              </span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold" fill="none" aria-hidden="true">
                <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      </div>

      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <AudioPlayer
        visible={playerOpen}
        playing={playing}
        ayahNumber={activeAyah ?? 1}
        ayahCount={surah.ayahCount}
        surahName={surah.englishName}
        reciterId={settings.quran.reciter}
        progress={progress}
        duration={duration}
        repeat={repeat}
        onToggle={() => setPlaying((p) => !p)}
        onPrevious={() => setActiveAyah((n) => Math.max(1, (n ?? 1) - 1))}
        onNext={() =>
          setActiveAyah((n) => Math.min(surah.ayahCount, (n ?? 1) + 1))
        }
        onSeek={seek}
        onReciter={(id) =>
          updateSettings((current) => ({
            ...current,
            quran: { ...current.quran, reciter: id },
          }))
        }
        onRepeat={setRepeat}
        onClose={() => {
          setPlaying(false);
          setPlayerOpen(false);
        }}
      />

      <AyahSheet
        ayah={sheetAyah}
        surahNumber={surah.number}
        surahName={surah.englishName}
        englishEdition={englishEdition}
        urduEdition={urduEdition}
        isPlaying={playing && activeAyah === sheetAyah?.numberInSurah}
        isBookmarked={
          sheetAyah
            ? isBookmarked(reading, surah.number, sheetAyah.numberInSurah)
            : false
        }
        onPlay={() => {
          if (!sheetAyah) return;
          if (activeAyah === sheetAyah.numberInSurah) setPlaying((p) => !p);
          else playAyah(sheetAyah.numberInSurah);
        }}
        onTafsir={() => {
          if (!sheetAyah) return;
          setTafsirAyah(sheetAyah.numberInSurah);
          setSheetAyah(null);
        }}
        onBookmark={() => {
          if (!sheetAyah) return;
          toggleBookmark(
            surah.number,
            sheetAyah.numberInSurah,
            `${surah.englishName} ${surah.number}:${sheetAyah.numberInSurah}`,
          );
        }}
        onClose={() => setSheetAyah(null)}
      />

      <TafsirPanel
        open={tafsirAyah !== null}
        surahNumber={surah.number}
        surahName={surah.englishName}
        ayahNumber={tafsirAyah}
        editionId={settings.quran.tafsirEdition}
        onEdition={(id) =>
          updateSettings((current) => ({
            ...current,
            quran: { ...current.quran, tafsirEdition: id },
          }))
        }
        onClose={() => setTafsirAyah(null)}
      />
    </div>
  );
}
