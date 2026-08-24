import { ARABIC_EDITION } from "@/data/editions";

const API = "https://api.alquran.cloud/v1";

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

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Fetches and unwraps the API envelope, retrying briefly on rate limiting.
 *
 * The upstream API is free and does throttle under load, so a transient 429
 * should not surface as a broken page. Backoff is short and bounded, since a
 * reader is waiting.
 */
async function getJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url, FOREVER);

  if (!res.ok) {
    if (RETRY_STATUSES.has(res.status) && attempt < 3) {
      await new Promise((resolve) =>
        setTimeout(resolve, 400 * 2 ** attempt),
      );
      return getJson<T>(url, attempt + 1);
    }
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

/**
 * Per ayah recitation. The global ayah number maps directly onto the file
 * name, so no extra request is needed to discover the audio URL.
 */
export function ayahAudioUrl(reciterId: string, globalNumber: number) {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalNumber}.mp3`;
}

/* ==========================================================================
   Juz

   A juz spans surah boundaries, so each ayah carries its own surah metadata
   and the reader inserts a heading wherever it changes.

   The multi edition form of this endpoint does not exist: /v1/juz/{n}/editions
   answers 404, unlike the surah route. So each edition is fetched separately
   in parallel and merged on the global ayah number.
   ========================================================================== */

export type JuzAyah = Ayah & {
  surahNumber: number;
  surahArabicName: string;
  surahEnglishName: string;
  /** True for the first ayah of a surah, where a heading is inserted. */
  startsSurah: boolean;
};

export type Juz = {
  number: number;
  ayahs: JuzAyah[];
  /** Surahs touched by this juz, in order, for the heading and the index. */
  surahs: { number: number; englishName: string; arabicName: string }[];
};

type CloudJuzAyah = CloudAyah & {
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
};

export async function fetchJuz(
  number: number,
  translationIds: string[],
): Promise<Juz> {
  const editions = [ARABIC_EDITION, ...translationIds];

  const responses = await Promise.all(
    editions.map((edition) =>
      getJson<{ number: number; ayahs: CloudJuzAyah[] }>(
        `${API}/juz/${number}/${edition}`,
      ),
    ),
  );

  const [arabic, ...rest] = responses;

  // Translations are keyed by the global ayah number so the merge does not
  // rely on the arrays lining up.
  const byEdition = rest.map((response, index) => {
    const map = new Map<number, string>();
    for (const ayah of response.ayahs) map.set(ayah.number, ayah.text);
    return { id: translationIds[index], map };
  });

  const surahs: Juz["surahs"] = [];
  let previousSurah = -1;

  const ayahs: JuzAyah[] = arabic.ayahs.map((ayah) => {
    const startsSurah = ayah.numberInSurah === 1;

    if (ayah.surah.number !== previousSurah) {
      surahs.push({
        number: ayah.surah.number,
        englishName: ayah.surah.englishName,
        arabicName: ayah.surah.name,
      });
      previousSurah = ayah.surah.number;
    }

    // The bismillah is prefixed to the opening ayah of each surah here too,
    // and Al Fatihah is the one place it is genuinely part of the text.
    const text =
      startsSurah && ayah.surah.number !== 1
        ? stripLeadingBismillah(ayah.text)
        : ayah.text.replace(/^\ufeff/, "");

    const translations: Record<string, string> = {};
    for (const edition of byEdition) {
      translations[edition.id] = edition.map.get(ayah.number) ?? "";
    }

    return {
      numberInSurah: ayah.numberInSurah,
      globalNumber: ayah.number,
      arabic: text,
      juz: ayah.juz,
      page: ayah.page,
      sajda: Boolean(ayah.sajda),
      translations,
      surahNumber: ayah.surah.number,
      surahArabicName: ayah.surah.name,
      surahEnglishName: ayah.surah.englishName,
      startsSurah,
    };
  });

  return { number: arabic.number, ayahs, surahs };
}

export const JUZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);
