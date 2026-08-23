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
