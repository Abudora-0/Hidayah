import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
  Qibla,
  SunnahTimes,
  type CalculationParameters,
} from "adhan";

export type PrayerKey =
  | "fajr"
  | "sunrise"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

/** Sunrise is shown on the timeline but is not a prayer, so it never alarms. */
export const OBLIGATORY_PRAYERS: PrayerKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const PRAYER_ORDER: PrayerKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const PRAYER_LABELS: Record<
  PrayerKey,
  { en: string; ar: string; ur: string; note: string; noteUr: string }
> = {
  fajr: { en: "Fajr", ar: "الفجر", ur: "فجر", note: "Before sunrise", noteUr: "طلوعِ آفتاب سے پہلے" },
  sunrise: { en: "Sunrise", ar: "الشروق", ur: "طلوع آفتاب", note: "Not a prayer time", noteUr: "یہ نماز کا وقت نہیں" },
  dhuhr: { en: "Dhuhr", ar: "الظهر", ur: "ظہر", note: "After midday", noteUr: "زوال کے بعد" },
  asr: { en: "Asr", ar: "العصر", ur: "عصر", note: "Afternoon", noteUr: "سہ پہر" },
  maghrib: { en: "Maghrib", ar: "المغرب", ur: "مغرب", note: "At sunset", noteUr: "غروبِ آفتاب پر" },
  isha: { en: "Isha", ar: "العشاء", ur: "عشاء", note: "Night", noteUr: "رات" },
};

export type MethodKey =
  | "Karachi"
  | "MuslimWorldLeague"
  | "UmmAlQura"
  | "Egyptian"
  | "NorthAmerica"
  | "Dubai"
  | "Qatar"
  | "Kuwait"
  | "Singapore"
  | "Turkey"
  | "Tehran"
  | "MoonsightingCommittee";

/**
 * Calculation methods, with the Aladhan identifier alongside each one so the
 * locally computed times can be checked against the published times for the
 * same authority.
 */
export const METHODS: Record<
  MethodKey,
  { label: string; region: string; aladhanId: number }
> = {
  Karachi: {
    label: "University of Islamic Sciences, Karachi",
    region: "Pakistan, India, Bangladesh, Afghanistan",
    aladhanId: 1,
  },
  MuslimWorldLeague: {
    label: "Muslim World League",
    region: "Europe, the Far East, parts of the US",
    aladhanId: 3,
  },
  UmmAlQura: {
    label: "Umm al Qura, Makkah",
    region: "Saudi Arabia",
    aladhanId: 4,
  },
  Egyptian: {
    label: "Egyptian General Authority of Survey",
    region: "Africa, Syria, Lebanon, Malaysia",
    aladhanId: 5,
  },
  NorthAmerica: {
    label: "Islamic Society of North America",
    region: "North America",
    aladhanId: 2,
  },
  Dubai: { label: "Dubai", region: "United Arab Emirates", aladhanId: 16 },
  Qatar: { label: "Qatar", region: "Qatar", aladhanId: 10 },
  Kuwait: { label: "Kuwait", region: "Kuwait", aladhanId: 9 },
  Singapore: { label: "Singapore", region: "Singapore", aladhanId: 11 },
  Turkey: { label: "Diyanet, Turkey", region: "Turkey", aladhanId: 13 },
  Tehran: {
    label: "Institute of Geophysics, Tehran",
    region: "Iran",
    aladhanId: 7,
  },
  MoonsightingCommittee: {
    label: "Moonsighting Committee",
    region: "Global, seasonal adjustment",
    aladhanId: 15,
  },
};

export type MadhabKey = "hanafi" | "shafi";

export const MADHAB_LABELS: Record<MadhabKey, { label: string; note: string }> = {
  hanafi: { label: "Hanafi", note: "Later Asr" },
  shafi: { label: "Shafi, Maliki, Hanbali", note: "Earlier Asr" },
};

export type PrayerSettings = {
  method: MethodKey;
  madhab: MadhabKey;
  /** Per prayer nudge in minutes, for matching a specific local mosque. */
  adjustments?: Partial<Record<PrayerKey, number>>;
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  method: "Karachi",
  madhab: "hanafi",
};

function buildParameters(
  settings: PrayerSettings,
  coordinates: Coordinates,
): CalculationParameters {
  const params = CalculationMethod[settings.method]();
  params.madhab = settings.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;

  // At northern latitudes the sun may never dip far enough below the horizon
  // for Fajr and Isha to have a real solution. The recommended rule picks the
  // right approximation for the given coordinates.
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);

  // Inside the polar circle the sun may not rise or set at all, and the
  // default resolution returns NaN for every time. AqrabBalad substitutes the
  // nearest latitude where the day still resolves, which is what almanacs for
  // those regions do.
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad;

  if (settings.adjustments) {
    params.adjustments = {
      ...params.adjustments,
      ...settings.adjustments,
    };
  }

  return params;
}

export type PrayerEntry = {
  key: PrayerKey;
  time: Date;
  isPrayer: boolean;
};

export type PrayerSchedule = {
  date: Date;
  entries: PrayerEntry[];
  /** The prayer window the user is currently inside, sunrise excluded. */
  currentKey: PrayerKey | null;
  next: { key: PrayerKey; time: Date; isTomorrow: boolean };
  /** The start of the window running into `next`, used for the progress ring. */
  previousTime: Date;
  sunnah: { middleOfTheNight: Date; lastThirdOfTheNight: Date };
  qibla: number;
};

function timesFor(
  latitude: number,
  longitude: number,
  date: Date,
  settings: PrayerSettings,
) {
  const coordinates = new Coordinates(latitude, longitude);
  return new PrayerTimes(coordinates, date, buildParameters(settings, coordinates));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Builds a full day of prayer times plus everything the interface needs to
 * describe where the user currently sits within it.
 *
 * Times are computed on the device rather than fetched, so the app keeps
 * working offline and is never rate limited. Aladhan is used only as an
 * independent cross check in the settings screen.
 */
export function getPrayerSchedule(
  latitude: number,
  longitude: number,
  settings: PrayerSettings = DEFAULT_PRAYER_SETTINGS,
  now: Date = new Date(),
): PrayerSchedule {
  const today = timesFor(latitude, longitude, now, settings);

  const entries: PrayerEntry[] = PRAYER_ORDER.map((key) => ({
    key,
    time: today[key],
    isPrayer: key !== "sunrise",
  }));

  const nextKey = today.nextPrayer(now);
  const currentRaw = today.currentPrayer(now);

  let next: PrayerSchedule["next"];
  if (nextKey === "none") {
    // Past Isha. The next prayer is tomorrow's Fajr.
    const tomorrow = timesFor(latitude, longitude, addDays(now, 1), settings);
    next = { key: "fajr", time: tomorrow.fajr, isTomorrow: true };
  } else {
    next = { key: nextKey, time: today[nextKey], isTomorrow: false };
  }

  // The window start is the previous entry, which may be yesterday's Isha when
  // the user opens the app between midnight and Fajr.
  let previousTime: Date;
  if (currentRaw === "none") {
    const yesterday = timesFor(latitude, longitude, addDays(now, -1), settings);
    previousTime = yesterday.isha;
  } else {
    previousTime = today[currentRaw];
  }

  return {
    date: now,
    entries,
    currentKey: currentRaw === "none" || currentRaw === "sunrise" ? null : currentRaw,
    next,
    previousTime,
    sunnah: new SunnahTimes(today),
    qibla: Qibla(new Coordinates(latitude, longitude)),
  };
}

/** Prayer times for a whole day, used by the push scheduler on the server. */
export function getDayTimes(
  latitude: number,
  longitude: number,
  date: Date,
  settings: PrayerSettings = DEFAULT_PRAYER_SETTINGS,
): Record<PrayerKey, Date> {
  const times = timesFor(latitude, longitude, date, settings);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function formatTime(date: Date, hour12: boolean) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(date);
}

/** Breaks a duration into the parts the countdown renders separately. */
export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalSeconds: total,
  };
}

/** How far through the current window we are, as a fraction between 0 and 1. */
export function windowProgress(from: Date, to: Date, now: Date) {
  const span = to.getTime() - from.getTime();
  if (span <= 0) return 0;
  const elapsed = now.getTime() - from.getTime();
  return Math.min(1, Math.max(0, elapsed / span));
}
