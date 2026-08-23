export type HijriDate = {
  day: number;
  month: number;
  year: number;
};

export const HIJRI_MONTHS: { en: string; ar: string }[] = [
  { en: "Muharram", ar: "مُحَرَّم" },
  { en: "Safar", ar: "صَفَر" },
  { en: "Rabi al Awwal", ar: "رَبيع الأوّل" },
  { en: "Rabi al Thani", ar: "رَبيع الآخر" },
  { en: "Jumada al Ula", ar: "جُمادى الأولى" },
  { en: "Jumada al Akhirah", ar: "جُمادى الآخرة" },
  { en: "Rajab", ar: "رَجَب" },
  { en: "Shaban", ar: "شَعْبان" },
  { en: "Ramadan", ar: "رَمَضان" },
  { en: "Shawwal", ar: "شَوّال" },
  { en: "Dhul Qadah", ar: "ذو القعدة" },
  { en: "Dhul Hijjah", ar: "ذو الحجة" },
];

/**
 * The Umm al Qura calendar, read straight from Intl rather than a conversion
 * library. It ships with the runtime, so there is nothing to keep in sync and
 * nothing extra to download.
 */
const HIJRI_FORMATTER = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function toHijri(date: Date): HijriDate {
  // Reading the parts in UTC against a date normalised to midday avoids the
  // day rolling over at the edges of a timezone.
  const anchored = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12),
  );

  const parts = HIJRI_FORMATTER.formatToParts(anchored);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { day: get("day"), month: get("month"), year: get("year") };
}

export function hijriMonthName(month: number) {
  return HIJRI_MONTHS[month - 1] ?? { en: "Unknown", ar: "" };
}

export function formatHijri(date: HijriDate, withYear = true) {
  const month = hijriMonthName(date.month);
  return withYear
    ? `${date.day} ${month.en} ${date.year} AH`
    : `${date.day} ${month.en}`;
}

export function formatHijriArabic(date: HijriDate) {
  const month = hijriMonthName(date.month);
  return `${date.day} ${month.ar} ${date.year}`;
}

/** True when both dates land on the same Hijri day. */
export function isSameHijriDay(a: HijriDate, b: HijriDate) {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * The Islamic day begins at sunset, so after Maghrib the Hijri date is already
 * tomorrow's. Callers that know the Maghrib time can pass it to get the date a
 * person would actually consider current.
 */
export function toHijriObservingSunset(date: Date, maghrib?: Date): HijriDate {
  if (maghrib && date.getTime() >= maghrib.getTime()) {
    return toHijri(addDays(date, 1));
  }
  return toHijri(date);
}

/* ==========================================================================
   Hijri to Gregorian

   Intl converts one way only, so the reverse is done by searching. The Umm al
   Qura month lengths are irregular, which rules out arithmetic conversion, but
   toHijri is cheap and monotonic so a short search lands exactly.
   ========================================================================== */

const MEAN_MONTH = 29.530588;
const MEAN_YEAR = 354.367;

/** A single ordinal for a Hijri month, so two of them can be compared. */
function monthIndex(date: HijriDate) {
  return date.year * 12 + (date.month - 1);
}

/**
 * The Gregorian date on which a given Hijri month begins.
 * Returns null if the search fails, which should only happen far outside the
 * range the Umm al Qura calendar covers.
 */
export function hijriMonthStart(year: number, month: number): Date | null {
  const target = year * 12 + (month - 1);

  // Rough starting point from the mean year and month lengths.
  const estimate = new Date(
    Date.UTC(622, 6, 19) +
      ((year - 1) * MEAN_YEAR + (month - 1) * MEAN_MONTH) * 86400000,
  );

  let cursor = new Date(
    estimate.getUTCFullYear(),
    estimate.getUTCMonth(),
    estimate.getUTCDate(),
  );

  // Jump whole months until we land inside the right one.
  for (let i = 0; i < 60; i++) {
    const delta = target - monthIndex(toHijri(cursor));
    if (delta === 0) break;
    cursor = addDays(cursor, Math.trunc(delta * MEAN_MONTH) || Math.sign(delta));
  }

  if (monthIndex(toHijri(cursor)) !== target) return null;

  // Step back to the first of that month.
  cursor = addDays(cursor, 1 - toHijri(cursor).day);

  // The step above assumes the days are contiguous. Verify, and nudge if the
  // boundary landed a day out.
  for (let i = 0; i < 3; i++) {
    const here = toHijri(cursor);
    if (here.day === 1 && here.month === month && here.year === year) {
      return startOfDay(cursor);
    }
    cursor = addDays(cursor, monthIndex(here) < target || here.day > 1 ? 1 : -1);
  }

  return null;
}

/** Number of days in a Hijri month, which varies between 29 and 30. */
export function hijriMonthLength(year: number, month: number): number {
  const start = hijriMonthStart(year, month);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const next = hijriMonthStart(nextYear, nextMonth);
  if (!start || !next) return 30;
  return Math.round((next.getTime() - start.getTime()) / 86400000);
}

export function addHijriMonths(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}
