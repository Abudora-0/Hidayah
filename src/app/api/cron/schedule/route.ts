import { NextResponse } from "next/server";

import {
  callbackUrl,
  schedulingConfigured,
  scheduleUpcoming,
} from "@/lib/push-schedule";
import { listSubscriptions, pushStorageConfigured } from "@/lib/push-store";

/**
 * The daily enqueue.
 *
 * Vercel's Hobby plan allows one cron run per day, with up to an hour of
 * drift, so this route never delivers a notification itself. It works out when
 * each subscriber's next prayers fall and hands them to QStash, which calls
 * back at the exact minute. The drift is harmless because only the enqueue is
 * affected, not the delivery.
 *
 * Because this runs once a day, subscribing also enqueues immediately. A
 * subscriber who arrives after today's run would otherwise wait until
 * tomorrow's before anything was queued for them at all.
 */

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

  if (!schedulingConfigured()) {
    return NextResponse.json(
      { skipped: "QSTASH_TOKEN and NEXT_PUBLIC_SITE_URL are required." },
      { status: 200 },
    );
  }

  const now = new Date();
  const subscriptions = await listSubscriptions();

  let scheduled = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const record of subscriptions) {
    const outcome = await scheduleUpcoming(record, now);
    scheduled += outcome.scheduled;
    skipped += outcome.skipped;
    failures.push(...outcome.failures);
  }

  return NextResponse.json({
    subscriptions: subscriptions.length,
    scheduled,
    skipped,
    failures,
    // Echoed so the address QStash will call back can be confirmed without
    // waiting for a prayer to pass. A stale value here, after a rename or a
    // domain change, makes every notification fail with nothing to see.
    callback: callbackUrl(),
    ranAt: now.toISOString(),
  });
}
