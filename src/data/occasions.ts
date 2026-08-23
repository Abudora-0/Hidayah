import type { HijriDate } from "@/lib/hijri";

export type OccasionKind = "eid" | "night" | "fast" | "season" | "day";

export type Occasion = {
  id: string;
  name: string;
  arabicName: string;
  month: number;
  /** Inclusive range within the month. A single day repeats the same number. */
  from: number;
  to: number;
  kind: OccasionKind;
  note: string;
};

/**
 * Fixed points in the Hijri year. Dates follow the Umm al Qura calendar, which
 * is calculated rather than sighted, so a local announcement may differ by a
 * day. The calendar says so on screen rather than implying false precision.
 */
export const OCCASIONS: Occasion[] = [
  {
    id: "new-year",
    name: "Islamic New Year",
    arabicName: "رأس السنة الهجرية",
    month: 1,
    from: 1,
    to: 1,
    kind: "day",
    note: "The first day of Muharram, one of the four sacred months.",
  },
  {
    id: "ashura",
    name: "Ashura",
    arabicName: "عاشوراء",
    month: 1,
    from: 9,
    to: 10,
    kind: "fast",
    note: "The tenth of Muharram. Fasting the ninth alongside it is the reported practice.",
  },
  {
    id: "mawlid",
    name: "Mawlid an Nabi",
    arabicName: "المولد النبوي",
    month: 3,
    from: 12,
    to: 12,
    kind: "day",
    note: "The birth of the Prophet, peace be upon him. Observance varies between communities.",
  },
  {
    id: "isra-miraj",
    name: "Isra and Miraj",
    arabicName: "الإسراء والمعراج",
    month: 7,
    from: 27,
    to: 27,
    kind: "night",
    note: "The night journey and ascension, commonly marked on the twenty seventh of Rajab.",
  },
  {
    id: "shab-e-barat",
    name: "Shab e Barat",
    arabicName: "ليلة البراءة",
    month: 8,
    from: 15,
    to: 15,
    kind: "night",
    note: "The middle night of Shaban, kept in prayer in many communities.",
  },
  {
    id: "ramadan",
    name: "Ramadan begins",
    arabicName: "رمضان",
    month: 9,
    from: 1,
    to: 1,
    kind: "season",
    note: "The month of fasting. The start depends on the sighting of the new moon.",
  },
  {
    id: "badr",
    name: "The Battle of Badr",
    arabicName: "غزوة بدر",
    month: 9,
    from: 17,
    to: 17,
    kind: "day",
    note: "Marked on the seventeenth of Ramadan.",
  },
  {
    id: "last-ten",
    name: "The last ten nights",
    arabicName: "العشر الأواخر",
    month: 9,
    from: 21,
    to: 30,
    kind: "season",
    note: "Laylat al Qadr is sought in the odd nights of these ten, most often the twenty seventh.",
  },
  {
    id: "laylat-al-qadr",
    name: "Laylat al Qadr",
    arabicName: "ليلة القدر",
    month: 9,
    from: 27,
    to: 27,
    kind: "night",
    note: "The night of decree, better than a thousand months. Its exact night is not fixed.",
  },
  {
    id: "eid-al-fitr",
    name: "Eid al Fitr",
    arabicName: "عيد الفطر",
    month: 10,
    from: 1,
    to: 1,
    kind: "eid",
    note: "The first of Shawwal, closing the month of fasting.",
  },
  {
    id: "hajj",
    name: "The days of Hajj",
    arabicName: "أيام الحج",
    month: 12,
    from: 8,
    to: 13,
    kind: "season",
    note: "The pilgrimage, from the eighth to the thirteenth of Dhul Hijjah.",
  },
  {
    id: "arafah",
    name: "The Day of Arafah",
    arabicName: "يوم عرفة",
    month: 12,
    from: 9,
    to: 9,
    kind: "fast",
    note: "The standing at Arafah. Fasting it is recommended for those not on Hajj.",
  },
  {
    id: "eid-al-adha",
    name: "Eid al Adha",
    arabicName: "عيد الأضحى",
    month: 12,
    from: 10,
    to: 10,
    kind: "eid",
    note: "The tenth of Dhul Hijjah, the feast of the sacrifice.",
  },
  {
    id: "tashriq",
    name: "The days of Tashriq",
    arabicName: "أيام التشريق",
    month: 12,
    from: 11,
    to: 13,
    kind: "day",
    note: "The three days following Eid al Adha.",
  },
];

/** The white days, the thirteenth to fifteenth of every Hijri month. */
export const WHITE_DAYS = {
  id: "ayyam-al-beed",
  name: "The white days",
  arabicName: "أيام البيض",
  kind: "fast" as OccasionKind,
  note: "The thirteenth, fourteenth and fifteenth of every month, kept as a fast.",
};

export const OCCASION_STYLES: Record<
  OccasionKind,
  { label: string; dot: string }
> = {
  eid: { label: "Eid", dot: "bg-gold" },
  night: { label: "Night", dot: "bg-gold-soft" },
  fast: { label: "Fast", dot: "bg-line-strong" },
  season: { label: "Season", dot: "bg-gold/60" },
  day: { label: "Observance", dot: "bg-ink-faint" },
};

export function occasionsOn(date: HijriDate): Occasion[] {
  return OCCASIONS.filter(
    (occasion) =>
      occasion.month === date.month &&
      date.day >= occasion.from &&
      date.day <= occasion.to,
  );
}

export function isWhiteDay(date: HijriDate) {
  return date.day >= 13 && date.day <= 15;
}

/** True when the day carries something worth marking on the grid. */
export function hasMarking(date: HijriDate) {
  return occasionsOn(date).length > 0;
}
