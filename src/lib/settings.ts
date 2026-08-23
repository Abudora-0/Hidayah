"use client";

import { useSyncExternalStore } from "react";

import {
  DEFAULT_PRAYER_SETTINGS,
  OBLIGATORY_PRAYERS,
  type MadhabKey,
  type MethodKey,
  type PrayerKey,
} from "./prayer";

export type Settings = {
  prayer: { method: MethodKey; madhab: MadhabKey };
  display: { hour12: boolean };
  quran: {
    showEnglish: boolean;
    showUrdu: boolean;
    englishEdition: string;
    urduEdition: string;
    reciter: string;
    tafsirEdition: string;
    arabicSize: number;
  };
  alarm: {
    /** Which prayers should notify. Sunrise is never included. */
    prayers: Record<string, boolean>;
    playAdhan: boolean;
  };
};

export const DEFAULT_SETTINGS: Settings = {
  prayer: {
    method: DEFAULT_PRAYER_SETTINGS.method,
    madhab: DEFAULT_PRAYER_SETTINGS.madhab,
  },
  display: { hour12: true },
  quran: {
    showEnglish: true,
    showUrdu: false,
    englishEdition: "en.sahih",
    urduEdition: "ur.qadri",
    reciter: "ar.alafasy",
    tafsirEdition: "en-tafisr-ibn-kathir",
    arabicSize: 30,
  },
  alarm: {
    prayers: Object.fromEntries(OBLIGATORY_PRAYERS.map((p) => [p, true])),
    playAdhan: true,
  },
};

const STORAGE_KEY = "hidayah-settings";

let cache: Settings | null = null;
const listeners = new Set<() => void>();

function merge(stored: unknown): Settings {
  const partial = (stored ?? {}) as Partial<Settings>;
  return {
    prayer: { ...DEFAULT_SETTINGS.prayer, ...partial.prayer },
    display: { ...DEFAULT_SETTINGS.display, ...partial.display },
    quran: { ...DEFAULT_SETTINGS.quran, ...partial.quran },
    alarm: {
      ...DEFAULT_SETTINGS.alarm,
      ...partial.alarm,
      prayers: {
        ...DEFAULT_SETTINGS.alarm.prayers,
        ...partial.alarm?.prayers,
      },
    },
  };
}

function read(): Settings {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = merge(raw ? JSON.parse(raw) : null);
  } catch {
    cache = DEFAULT_SETTINGS;
  }
  return cache;
}

function emit() {
  for (const listener of listeners) listener();
}

export function updateSettings(patch: (current: Settings) => Settings) {
  const next = patch(read());
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable. The change still applies for this session.
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple tabs consistent.
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      cache = null;
      emit();
    }
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);
}

export function setAlarmForPrayer(prayer: PrayerKey, enabled: boolean) {
  updateSettings((current) => ({
    ...current,
    alarm: {
      ...current.alarm,
      prayers: { ...current.alarm.prayers, [prayer]: enabled },
    },
  }));
}
