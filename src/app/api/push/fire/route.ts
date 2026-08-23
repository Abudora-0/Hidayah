import { Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";

import { OBLIGATORY_PRAYERS, type PrayerKey } from "@/lib/prayer";
import { sendPrayerNotification, vapidConfigured } from "@/lib/push-server";
import {
  getSubscription,
  pushStorageConfigured,
  removeSubscription,
} from "@/lib/push-store";

/**
 * Delivers one prayer notification at the moment QStash calls back.
 *
 * The request is verified against the QStash signing keys, because this route
 * is public and would otherwise let anyone notify any subscriber at any time.
 */

type Payload = {
  subscriptionId?: string;
  prayer?: string;
  at?: string;
};

async function verify(request: Request, raw: string) {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;

  // Without keys configured the route refuses rather than trusting the caller.
  if (!current || !next) return false;

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  const receiver = new Receiver({
    currentSigningKey: current,
    nextSigningKey: next,
  });

  try {
    return await receiver.verify({ signature, body: raw });
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (!(await verify(request, raw))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!pushStorageConfigured() || !vapidConfigured()) {
    return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  }

  let payload: Payload;
  try {
    payload = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { subscriptionId, prayer, at } = payload;

  if (
    !subscriptionId ||
    !prayer ||
    !(OBLIGATORY_PRAYERS as string[]).includes(prayer)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const record = await getSubscription(subscriptionId);
  if (!record) {
    // Already unsubscribed. Nothing to do, and no reason for QStash to retry.
    return NextResponse.json({ status: "gone" });
  }

  if (!record.prayers.includes(prayer as PrayerKey)) {
    return NextResponse.json({ status: "muted" });
  }

  const result = await sendPrayerNotification(record, {
    prayer: prayer as PrayerKey,
    at: at ?? new Date().toISOString(),
  });

  if (result === "gone") {
    // The browser discarded this subscription, so stop holding on to it.
    await removeSubscription(subscriptionId);
  }

  return NextResponse.json({ status: result });
}
