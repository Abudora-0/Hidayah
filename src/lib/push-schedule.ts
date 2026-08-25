import { Client } from "@upstash/qstash";

import { getDayTimes, type PrayerKey } from "./prayer";
import { dateForLocalDay, formatLocalDay, localDateInZone } from "./push-server";
import {
  claimSchedule,
  confirmSchedule,
  isScheduleClaimed,
  releaseSchedule,
  type PushSubscriptionRecord,
} from "./push-store";

/**
 * Handing prayers to QStash, which calls back at the minute each one begins.
 *
 * This is shared by the daily cron and by subscribing, because a subscriber
 * who arrives after the day's run would otherwise be queued for nothing until
 * the next one, and hear nothing for up to a day. Claiming each prayer in
 * Redis first means the two callers cannot notify anyone twice.
 */

/** Slightly longer than a day, so nothing falls between two cron runs. */
const WINDOW_HOURS = 26;
const MAX_QSTASH_DELAY_DAYS = 7;

export type ScheduleOutcome = {
  scheduled: number;
  skipped: number;
  failures: string[];
};

export function schedulingConfigured() {
  return Boolean(process.env.QSTASH_TOKEN && process.env.NEXT_PUBLIC_SITE_URL);
}

/** Where QStash is told to call back. */
export function callbackUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${siteUrl.replace(/\/$/, "")}/api/push/fire`;
}

/**
 * Queues every prayer this subscriber has asked for that falls inside the
 * window and has not been claimed already.
 */
export async function scheduleUpcoming(
  record: PushSubscriptionRecord,
  now = new Date(),
): Promise<ScheduleOutcome> {
  const outcome: ScheduleOutcome = { scheduled: 0, skipped: 0, failures: [] };

  if (!schedulingConfigured()) return outcome;

  const qstash = new Client({ token: process.env.QSTASH_TOKEN as string });
  const callback = callbackUrl();

  const horizon = new Date(now.getTime() + WINDOW_HOURS * 3600 * 1000);
  const maxDelay = new Date(
    now.getTime() + MAX_QSTASH_DELAY_DAYS * 24 * 3600 * 1000,
  );

  // The subscriber's own calendar day, and the one after it, so the window can
  // span midnight wherever they are.
  const today = localDateInZone(record.timeZone, now);
  const tomorrow = localDateInZone(
    record.timeZone,
    new Date(now.getTime() + 24 * 3600 * 1000),
  );

  for (const day of [today, tomorrow]) {
    const times = getDayTimes(
      record.latitude,
      record.longitude,
      dateForLocalDay(day.year, day.month, day.day),
      { method: record.method, madhab: record.madhab },
    );

    for (const prayer of record.prayers) {
      const at = times[prayer as PrayerKey];
      if (!at || Number.isNaN(at.getTime())) continue;
      if (at <= now || at > horizon || at > maxDelay) {
        outcome.skipped += 1;
        continue;
      }

      const claimed = await claimSchedule(
        record.id,
        formatLocalDay(day),
        prayer,
      );
      if (!claimed) {
        outcome.skipped += 1;
        continue;
      }

      const localDay = formatLocalDay(day);

      try {
        const message = await qstash.publishJSON({
          url: callback,
          body: { subscriptionId: record.id, prayer, at: at.toISOString() },
          // Absolute delivery time in whole seconds, so the notification lands
          // on the prayer rather than near it.
          notBefore: Math.floor(at.getTime() / 1000),
        });

        // Only now is the prayer genuinely scheduled. Until this, the key is
        // a reservation, and treating one as done is what let a failed
        // handover mark a prayer as delivered and skip it thereafter.
        await confirmSchedule(record.id, localDay, prayer, message.messageId);
        outcome.scheduled += 1;
      } catch (error) {
        // Hand the reservation back, so the next run tries again rather than
        // leaving the prayer marked as done and never sent.
        await releaseSchedule(record.id, localDay, prayer);
        outcome.failures.push(
          `${record.id}:${prayer}: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        );
      }
    }
  }

  return outcome;
}

/**
 * What is actually waiting to be delivered for this subscriber.
 *
 * Reporting the count only at the moment of subscribing meant it vanished on
 * the next reload, which is exactly when someone wants to check. The claims
 * are already in storage, so the answer can simply be read back.
 */
export async function describeQueue(
  record: PushSubscriptionRecord,
  now = new Date(),
): Promise<{ queued: number; nextPrayer: string | null; nextAt: string | null }> {
  const horizon = new Date(now.getTime() + WINDOW_HOURS * 3600 * 1000);

  const today = localDateInZone(record.timeZone, now);
  const tomorrow = localDateInZone(
    record.timeZone,
    new Date(now.getTime() + 24 * 3600 * 1000),
  );

  const waiting: { prayer: string; at: Date }[] = [];

  for (const day of [today, tomorrow]) {
    const times = getDayTimes(
      record.latitude,
      record.longitude,
      dateForLocalDay(day.year, day.month, day.day),
      { method: record.method, madhab: record.madhab },
    );

    for (const prayer of record.prayers) {
      const at = times[prayer as PrayerKey];
      if (!at || Number.isNaN(at.getTime())) continue;
      if (at <= now || at > horizon) continue;
      if (!(await isScheduleClaimed(record.id, formatLocalDay(day), prayer))) {
        continue;
      }
      waiting.push({ prayer, at });
    }
  }

  waiting.sort((a, b) => a.at.getTime() - b.at.getTime());
  const next = waiting[0];

  return {
    queued: waiting.length,
    nextPrayer: next ? next.prayer : null,
    nextAt: next ? next.at.toISOString() : null,
  };
}
