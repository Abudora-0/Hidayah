"use client";

import { useEffect, useRef } from "react";

import { playAlarm } from "@/lib/alarm-sound";
import { PRAYER_LABELS, type PrayerKey } from "@/lib/prayer";

type PrayerAlarmProps = {
  nextKey: PrayerKey;
  nextTime: Date;
  now: Date;
  enabled: boolean;
  playSound: boolean;
};

/**
 * The alarm that runs while the site is open.
 *
 * Background delivery is handled by the service worker and Web Push. This
 * covers the case the push path cannot: the tab is open, so it can make a
 * sound, which a service worker is not allowed to do.
 *
 * Firing is keyed on the exact prayer instant, so a re-render, a settings
 * change or a clock tick cannot make it sound twice.
 */
export function PrayerAlarm({
  nextKey,
  nextTime,
  now,
  enabled,
  playSound,
}: PrayerAlarmProps) {
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const key = `${nextKey}:${nextTime.getTime()}`;
    const remaining = nextTime.getTime() - now.getTime();

    // Fire once, in the second the prayer arrives. A generous lower bound
    // covers a tab that was suspended and woke up slightly late.
    if (remaining > 0 || remaining < -60_000) return;
    if (firedFor.current === key) return;

    firedFor.current = key;

    const label = PRAYER_LABELS[nextKey];

    if (playSound) void playAlarm();

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(`${label.en} ${label.ar}`, {
        body: "It is time for prayer.",
        icon: "/icons/192",
        tag: `hidayah-${nextKey}`,
      });
    }
  }, [enabled, nextKey, nextTime, now, playSound]);

  // The service worker tells open tabs when a push arrives, so the adhan can
  // play here rather than staying silent behind the notification.
  useEffect(() => {
    if (!playSound || typeof navigator === "undefined" || !navigator.serviceWorker) {
      return;
    }

    function onMessage(event: MessageEvent) {
      if (event.data?.type === "hidayah-prayer") void playAlarm();
    }

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [playSound]);

  return null;
}
