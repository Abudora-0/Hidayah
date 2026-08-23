"use client";

import { useMemo, useSyncExternalStore } from "react";

/* ==========================================================================
   A single shared clock

   One interval drives every countdown on the page rather than one per
   component, and the snapshot is a primitive so React can compare it cheaply.
   ========================================================================== */

let nowMs = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);

  if (!timer) {
    nowMs = Date.now();
    timer = setInterval(() => {
      nowMs = Date.now();
      for (const l of clockListeners) l();
    }, 1000);
  }

  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

// Zero on the server and on the very first client render, so the two agree.
// The clock starts as soon as React subscribes, one tick later.
const getClockSnapshot = () => nowMs;
const getClockServerSnapshot = () => 0;

/**
 * The current time, or null until the clock has started.
 *
 * Returning null for the first render is deliberate. The server cannot know
 * the client's clock, so rendering a time directly would mismatch on hydration
 * every single load.
 */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getClockServerSnapshot,
  );
  return useMemo(() => (ms === 0 ? null : new Date(ms)), [ms]);
}

/* ==========================================================================
   Mount detection
   ========================================================================== */

const noopSubscribe = () => () => {};

/** False during server render, true once React is running in the browser. */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/* ==========================================================================
   Media queries
   ========================================================================== */

const queryCache = new Map<
  string,
  { list: MediaQueryList; subscribe: (l: () => void) => () => void }
>();

function getQuery(query: string) {
  let entry = queryCache.get(query);
  if (!entry) {
    const list = window.matchMedia(query);
    entry = {
      list,
      subscribe(listener: () => void) {
        list.addEventListener("change", listener);
        return () => list.removeEventListener("change", listener);
      },
    };
    queryCache.set(query, entry);
  }
  return entry;
}

export function useMediaQuery(query: string) {
  const { subscribe, getSnapshot } = useMemo(
    () => ({
      subscribe: (listener: () => void) => getQuery(query).subscribe(listener),
      getSnapshot: () => getQuery(query).list.matches,
    }),
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True when the visitor has asked for reduced motion. */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
