import { ARABIC_EDITION } from "@/data/editions";

const API = "https://api.alquran.cloud/v1";
const TAFSIR_CDN =
  "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

/**
 * The text of the Quran does not change, so responses are cached for a year.
 * Next does not cache fetch by default, so this has to be explicit.
 */
const FOREVER = { next: { revalidate: 31536000 } } as const;

export type SurahSummary = {
  number: number;
  arabicName: string;
  englishName: string;
  translatedName: string;
  ayahCount: number;
  revelation: string;
};

export type Ayah = {
  numberInSurah: number;
  /** Position in the whole Quran, 1 to 6236. Used to build the audio URL. */
  globalNumber: number;
  arabic: string;
  juz: number;
  page: number;
  sajda: boolean;
  translations: Record<string, string>;
};

export type Surah = SurahSummary & {
  ayahs: Ayah[];
  /** At Tawbah is the one surah that does not open with the bismillah. */
  hasBismillah: boolean;
};

/* ==========================================================================
   Bismillah handling

   The Arabic edition prepends the bismillah to the first ayah of every surah
   except At Tawbah, even though it is only part of the text in Al Fatihah. It
   is rendered separately in the surah opening, so leaving it in place would
   print it twice.

   Matching is done with diacritics removed, because the exact vowel marking
   differs between editions and a literal string comparison is brittle.
   ========================================================================== */

const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ﻿]/g;

export function withoutDiacritics(text: string) {
  return text
    .replace(DIACRITICS, "")
    .replace(/ٱ/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

const BISMILLAH_BARE = withoutDiacritics(
  "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
);

export function stripLeadingBismillah(text: string) {
  const cleaned = text.replace(/^﻿/, "");

  let end = 0;
  let acc = "";
  for (let i = 0; i < cleaned.length && i < 90; i++) {
    acc += cleaned[i];
    // Keep extending while the bare form still matches, so trailing vowel
    // marks belonging to the bismillah are consumed too.
    if (withoutDiacritics(acc) === BISMILLAH_BARE) end = i + 1;
  }

  if (end === 0) return cleaned;
  return cleaned.slice(end).trim();
}

/* ==========================================================================
   Fetching
   ========================================================================== */

type CloudAyah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  sajda: boolean | { recommended?: boolean; obligatory?: boolean };
};

type CloudSurah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: CloudAyah[];
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, FOREVER);
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}: ${url}`);
  }
  const body = (await res.json()) as { code: number; data: T };
  return body.data;
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const data = await getJson<CloudSurah[]>(`${API}/surah`);
  return data.map((surah) => ({
    number: surah.number,
    arabicName: surah.name,
    englishName: surah.englishName,
    translatedName: surah.englishNameTranslation,
    ayahCount: surah.numberOfAyahs,
    revelation: surah.revelationType === "Meccan" ? "Meccan" : "Medinan",
  }));
}

/**
 * Loads one surah with the Arabic text and any number of translations in a
 * single request, which is the whole reason this API was chosen over the
 * alternatives.
 */
export async function fetchSurah(
  number: number,
  translationIds: string[],
): Promise<Surah> {
  const editions = [ARABIC_EDITION, ...translationIds].join(",");
  const data = await getJson<CloudSurah[]>(
    `${API}/surah/${number}/editions/${editions}`,
  );

  const [arabic, ...rest] = data;
  const hasBismillah = number !== 9;

  const ayahs: Ayah[] = arabic.ayahs.map((ayah, index) => {
    // Al Fatihah counts the bismillah as its first ayah, so it stays.
    const text =
      index === 0 && number !== 1
        ? stripLeadingBismillah(ayah.text)
        : ayah.text.replace(/^﻿/, "");

    const translations: Record<string, string> = {};
    rest.forEach((edition, editionIndex) => {
      translations[translationIds[editionIndex]] =
        edition.ayahs[index]?.text ?? "";
    });

    return {
      numberInSurah: ayah.numberInSurah,
      globalNumber: ayah.number,
      arabic: text,
      juz: ayah.juz,
      page: ayah.page,
      sajda: Boolean(ayah.sajda),
      translations,
    };
  });

  return {
    number: arabic.number,
    arabicName: arabic.name,
    englishName: arabic.englishName,
    translatedName: arabic.englishNameTranslation,
    ayahCount: arabic.numberOfAyahs,
    revelation: arabic.revelationType === "Meccan" ? "Meccan" : "Medinan",
    hasBismillah,
    ayahs,
  };
}

export type TafsirEntry = { ayah: number; text: string };

type TafsirResponse = {
  ayahs?: { ayah: number; text: string }[];
} | { text: string }[];

/** Tafsir for a whole surah, keyed by ayah number. */
export async function fetchTafsir(
  editionId: string,
  surah: number,
): Promise<Map<number, string>> {
  const res = await fetch(`${TAFSIR_CDN}/${editionId}/${surah}.json`, FOREVER);
  if (!res.ok) return new Map();

  const body = (await res.json()) as TafsirResponse;
  const map = new Map<number, string>();

  if (Array.isArray(body)) {
    body.forEach((entry, index) => map.set(index + 1, entry.text));
  } else if (body.ayahs) {
    for (const entry of body.ayahs) map.set(entry.ayah, entry.text);
  }

  return map;
}

/**
 * Per ayah recitation. The global ayah number maps directly onto the file
 * name, so no extra request is needed to discover the audio URL.
 */
export function ayahAudioUrl(reciterId: string, globalNumber: number) {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalNumber}.mp3`;
}

export const JUZ_COUNT = 30;
export const TOTAL_AYAHS = 6236;
