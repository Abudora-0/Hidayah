import { Client } from "@upstash/qstash";
import { NextResponse } from "next/server";

import { getDayTimes, type PrayerKey } from "@/lib/prayer";
import {
  dateForLocalDay,
  formatLocalDay,
  localDateInZone,
} from "@/lib/push-server";
import {
  claimSchedule,
  listSubscriptions,
  pushStorageConfigured,
} from "@/lib/push-store";

/**
 * The daily enqueue.
 *
 * Vercel's Hobby plan allows one cron run per day, with up to an hour of
 * drift, so this route never delivers a notification itself. It works out when
 * each subscriber's next prayers fall and hands them to QStash, which calls
 * back at the exact minute. The drift is harmless because only the enqueue is
 * affected, not the delivery.
 *
 * A rolling window slightly longer than a day is covered so that nothing falls
 * between two runs. Each prayer is claimed in Redis first, so the overlap
 * cannot notify anyone twice.
 */

const WINDOW_HOURS = 26;
const MAX_QSTASH_DELAY_DAYS = 7;

export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) return unauthorized();
  }

  if (!pushStorageConfigured()) {
    return NextResponse.json(
      { skipped: "Push storage is not configured." },
      { status: 200 },
    );
  }

  const token = process.env.QSTASH_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!token || !siteUrl) {
    return NextResponse.json(
      { skipped: "QSTASH_TOKEN and NEXT_PUBLIC_SITE_URL are required." },
      { status: 200 },
    );
  }

  const qstash = new Client({ token });
  const callback = `${siteUrl.replace(/\/$/, "")}/api/push/fire`;

  const now = new Date();
  const horizon = new Date(now.getTime() + WINDOW_HOURS * 3600 * 1000);
  const maxDelay = new Date(
    now.getTime() + MAX_QSTASH_DELAY_DAYS * 24 * 3600 * 1000,
  );

  const subscriptions = await listSubscriptions();

  let scheduled = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const record of subscriptions) {
    // The subscriber's own calendar day, and the one after it, so the window
    // can span midnight wherever they are.
    const today = localDateInZone(record.timeZone, now);
    const tomorrowInstant = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomorrow = localDateInZone(record.timeZone, tomorrowInstant);

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
          skipped += 1;
          continue;
        }

        const claimed = await claimSchedule(
          record.id,
          formatLocalDay(day),
          prayer,
        );
        if (!claimed) {
          skipped += 1;
          continue;
        }

        try {
          await qstash.publishJSON({
            url: callback,
            body: {
              subscriptionId: record.id,
              prayer,
              at: at.toISOString(),
            },
            // Absolute delivery time in whole seconds, so the notification
            // lands on the prayer rather than near it.
            notBefore: Math.floor(at.getTime() / 1000),
          });
          scheduled += 1;
        } catch (error) {
          failures.push(
            `${record.id}:${prayer}: ${error instanceof Error ? error.message : "unknown"}`,
          );
        }
      }
    }
  }

  return NextResponse.json({
    subscriptions: subscriptions.length,
    scheduled,
    skipped,
    failures,
    // Echoed so the address QStash will call back can be confirmed without
    // waiting for a prayer to pass. A stale value here, after a rename or a
    // domain change, makes every notification fail with nothing to see.
    callback,
    ranAt: now.toISOString(),
  });
}
