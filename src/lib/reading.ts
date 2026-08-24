"use client";

import { useSyncExternalStore } from "react";

import type { PrayerKey } from "./prayer";

export type LastRead = {
  kind: "surah" | "juz";
  /** Surah number, or juz number when kind is juz. */
  number: number;
  ayah: number;
  /** Shown on the resume card, so it does not have to be looked up again. */
  label: string;
  at: number;
};

export type Bookmark = {
  surah: number;
  ayah: number;
  label: string;
  at: number;
};

type ReadingState = {
  lastRead: LastRead | null;
  bookmarks: Bookmark[];
  /** Prayers marked as prayed, keyed by local date then prayer. */
  prayed: Record<string, PrayerKey[]>;
};

const STORAGE_KEY = "hidayah-reading";

const EMPTY: ReadingState = { lastRead: null, bookmarks: [], prayed: {} };

/* ==========================================================================
   Store

   Same shape as settings.ts and location.ts: external mutable state exposed
   through a subscription, with a cached snapshot so its identity only changes
   when the value does. useSyncExternalStore requires that.
   ========================================================================== */

let cache: ReadingState | null = null;
const listeners = new Set<() => void>();

function read(): ReadingState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ReadingState>) : {};
    cache = {
      lastRead: parsed.lastRead ?? null,
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      prayed: parsed.prayed ?? {},
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function commit(next: ReadingState) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing. The change still applies for this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      cache = null;
      for (const l of listeners) l();
    }
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useReading(): ReadingState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/* ==========================================================================
   Reading position
   ========================================================================== */

export function setLastRead(entry: Omit<LastRead, "at">) {
  const current = read();
  const previous = current.lastRead;

  // Written on scroll, so skip the store when nothing meaningful moved.
  if (
    previous &&
    previous.kind === entry.kind &&
    previous.number === entry.number &&
    previous.ayah === entry.ayah
  ) {
    return;
  }

  commit({ ...current, lastRead: { ...entry, at: Date.now() } });
}

/* ==========================================================================
   Bookmarks
   ========================================================================== */

export function isBookmarked(state: ReadingState, surah: number, ayah: number) {
  return state.bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
}

export function toggleBookmark(surah: number, ayah: number, label: string) {
  const current = read();
  const exists = current.bookmarks.some(
    (b) => b.surah === surah && b.ayah === ayah,
  );

  const bookmarks = exists
    ? current.bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah))
    : [{ surah, ayah, label, at: Date.now() }, ...current.bookmarks];

  commit({ ...current, bookmarks });
}

export function clearBookmarks() {
  commit({ ...read(), bookmarks: [] });
}

/* ==========================================================================
   Prayer tracker
   ========================================================================== */

/** Local calendar day, not UTC, so a prayer lands on the day it was prayed. */
export function dayKey(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function prayedOn(state: ReadingState, key: string): PrayerKey[] {
  return state.prayed[key] ?? [];
}

export function togglePrayed(prayer: PrayerKey, key: string = dayKey()) {
  const current = read();
  const today = current.prayed[key] ?? [];
  const next = today.includes(prayer)
    ? today.filter((p) => p !== prayer)
    : [...today, prayer];

  const prayed = { ...current.prayed };
  if (next.length === 0) delete prayed[key];
  else prayed[key] = next;

  commit({ ...current, prayed });
}

/**
 * Consecutive days, ending today, on which every obligatory prayer was marked.
 * Today is not counted as a break while it is still in progress, so the streak
 * does not read as zero every morning.
 */
export function currentStreak(state: ReadingState, required: number) {
  let streak = 0;
  const cursor = new Date();

  const todayComplete = prayedOn(state, dayKey(cursor)).length >= required;
  if (!todayComplete) cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 400; i++) {
    if (prayedOn(state, dayKey(cursor)).length >= required) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** The last n days, oldest first, for the strip on the dashboard. */
export function recentDays(state: ReadingState, days: number) {
  const out: { key: string; date: Date; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = dayKey(date);
    out.push({ key, date, count: prayedOn(state, key).length });
  }
  return out;
}
