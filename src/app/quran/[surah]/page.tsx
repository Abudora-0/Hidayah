import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SurahReader } from "@/components/quran/SurahReader";
import { DEFAULT_ENGLISH, DEFAULT_URDU } from "@/data/editions";
import { fetchSurah, fetchSurahList } from "@/lib/quran";

const PRELOADED = [DEFAULT_ENGLISH, DEFAULT_URDU];

function parseSurahNumber(value: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 114) return null;
  return number;
}

/**
 * Surah pages render on first request and are then cached for a year, which
 * is safe because the text does not change.
 *
 * They are deliberately not prerendered at build time. Doing so fires 114
 * parallel requests at a free API, which rate limits and fails the build. On
 * demand rendering spreads those requests over real traffic, and each surah is
 * only ever fetched once.
 */
export const revalidate = 31536000;

export async function generateMetadata({
  params,
}: PageProps<"/quran/[surah]">): Promise<Metadata> {
  const { surah } = await params;
  const number = parseSurahNumber(surah);
  if (!number) return { title: "Surah not found" };

  const list = await fetchSurahList();
  const entry = list[number - 1];

  return {
    title: `${entry.englishName}, ${entry.translatedName}`,
    description: `Surah ${entry.englishName} with Arabic text, English and Urdu translation, tafsir and recitation. ${entry.ayahCount} ayahs, revealed in ${entry.revelation === "Meccan" ? "Makkah" : "Madinah"}.`,
  };
}

export default async function SurahPage({ params }: PageProps<"/quran/[surah]">) {
  const { surah: raw } = await params;
  const number = parseSurahNumber(raw);
  if (!number) notFound();

  const [surah, list] = await Promise.all([
    fetchSurah(number, PRELOADED),
    fetchSurahList(),
  ]);

  const previous =
    number > 1
      ? { number: number - 1, name: list[number - 2].englishName }
      : null;
  const next =
    number < 114 ? { number: number + 1, name: list[number].englishName } : null;

  return (
    <SurahReader
      surah={surah}
      loadedEditions={PRELOADED}
      previous={previous}
      next={next}
    />
  );
}
