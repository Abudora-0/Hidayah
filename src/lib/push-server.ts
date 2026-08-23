import webpush from "web-push";

import { PRAYER_LABELS, type PrayerKey } from "./prayer";
import type { PushSubscriptionRecord } from "./push-store";

export function vapidConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

let configured = false;

function ensureVapid() {
  if (configured) return;
  if (!vapidConfigured()) throw new Error("VAPID keys are not configured");

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hidayah@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
  configured = true;
}

export type PrayerNotification = {
  prayer: PrayerKey;
  /** ISO instant the prayer begins, so the worker can show a local time. */
  at: string;
};

export type SendResult = "sent" | "gone" | "failed";

/**
 * Delivers one prayer notification.
 *
 * A 404 or 410 from the push service means the browser threw the subscription
 * away, so the caller should stop trying rather than retrying forever.
 */
export async function sendPrayerNotification(
  record: PushSubscriptionRecord,
  payload: PrayerNotification,
): Promise<SendResult> {
  ensureVapid();

  const label = PRAYER_LABELS[payload.prayer];

  try {
    await webpush.sendNotification(
      {
        endpoint: record.endpoint,
        keys: record.keys,
      },
      JSON.stringify({
        title: `${label.en} ${label.ar}`,
        body: "It is time for prayer.",
        prayer: payload.prayer,
        at: payload.at,
        timeZone: record.timeZone,
      }),
      { TTL: 900, urgency: "high" },
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    return "failed";
  }
}

/**
 * The calendar date in a given time zone at a given instant.
 *
 * The server runs in UTC while the user is somewhere else, so their current
 * day has to be read through their zone rather than assumed.
 */
export function localDateInZone(timeZone: string, instant: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Builds a Date whose local calendar fields match the given day.
 *
 * adhan reads the year, month and day through the local getters, so building
 * the date with the local constructor makes the calculation correct whatever
 * time zone the server happens to run in.
 */
export function dateForLocalDay(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatLocalDay({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
