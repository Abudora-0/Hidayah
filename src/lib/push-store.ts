import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

import type { MadhabKey, MethodKey, PrayerKey } from "./prayer";

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  latitude: number;
  longitude: number;
  timeZone: string;
  method: MethodKey;
  madhab: MadhabKey;
  /** Which prayers this device wants to be told about. */
  prayers: PrayerKey[];
  createdAt: number;
};

const KEY_PREFIX = "hidayah:sub:";
const INDEX_KEY = "hidayah:subs";

/**
 * Push is optional. Without the Upstash credentials the app still runs and
 * falls back to the in tab alarm, so a fresh clone works with no setup at all.
 */
export function pushStorageConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

let client: Redis | null = null;

function redis(): Redis {
  if (!pushStorageConfigured()) {
    throw new Error("Upstash Redis is not configured");
  }
  client ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  });
  return client;
}

/**
 * Subscriptions are keyed by a hash of the endpoint rather than the endpoint
 * itself, which keeps the raw push URL out of key names and makes re-enabling
 * on the same device overwrite the old record instead of duplicating it.
 */
export function subscriptionId(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

export async function saveSubscription(record: PushSubscriptionRecord) {
  const store = redis();
  await store.set(KEY_PREFIX + record.id, record);
  await store.sadd(INDEX_KEY, record.id);
}

export async function removeSubscription(id: string) {
  const store = redis();
  await store.del(KEY_PREFIX + id);
  await store.srem(INDEX_KEY, id);
}

export async function getSubscription(id: string) {
  const store = redis();
  return (await store.get<PushSubscriptionRecord>(KEY_PREFIX + id)) ?? null;
}

export async function listSubscriptionIds() {
  const store = redis();
  return (await store.smembers(INDEX_KEY)) ?? [];
}

export async function listSubscriptions() {
  const ids = await listSubscriptionIds();
  if (ids.length === 0) return [];

  const store = redis();
  const records = await Promise.all(
    ids.map((id) => store.get<PushSubscriptionRecord>(KEY_PREFIX + id)),
  );

  // Drop index entries whose record has expired or been removed.
  const alive: PushSubscriptionRecord[] = [];
  const dead: string[] = [];
  records.forEach((record, index) => {
    if (record) alive.push(record);
    else dead.push(ids[index]);
  });

  if (dead.length > 0) await store.srem(INDEX_KEY, ...dead);

  return alive;
}

/** Reserved, but the handover to QStash has not been confirmed. */
const PENDING = "pending";

function scheduleKey(
  subscriptionId: string,
  localDate: string,
  prayer: PrayerKey,
) {
  return `hidayah:sched:${subscriptionId}:${localDate}:${prayer}`;
}

/**
 * Whether a prayer has genuinely been handed to QStash.
 *
 * A bare reservation does not count. Reserving happens before the handover,
 * so treating one as done reports prayers as waiting that nothing will ever
 * deliver, which is worse than reporting none at all.
 */
export async function isScheduleClaimed(
  subscriptionId: string,
  localDate: string,
  prayer: PrayerKey,
) {
  const store = redis();
  const value = await store.get(scheduleKey(subscriptionId, localDate, prayer));
  return value !== null && value !== PENDING && value !== 1;
}

/**
 * Reserves one prayer on one day, so it is enqueued once and not twice.
 *
 * The daily cron enqueues a rolling window, so without this a prayer near the
 * window boundary could be enqueued twice and the user notified twice.
 *
 * A reservation that was never confirmed is handed out again. That state means
 * the handover failed, or died part way, and the prayer would otherwise stay
 * marked as done and be silently skipped for as long as the key survives. The
 * risk is a repeat notification where a handover succeeded but its
 * confirmation did not, which is a far smaller fault than silence.
 */
export async function claimSchedule(
  subscriptionId: string,
  localDate: string,
  prayer: PrayerKey,
) {
  const store = redis();
  const key = scheduleKey(subscriptionId, localDate, prayer);

  const fresh = await store.set(key, PENDING, { nx: true, ex: 60 * 60 * 48 });
  if (fresh === "OK") return true;

  const existing = await store.get(key);
  if (existing === PENDING || existing === 1) {
    await store.set(key, PENDING, { ex: 60 * 60 * 48 });
    return true;
  }

  return false;
}

/** Records that QStash accepted the message, which is what confirms it. */
export async function confirmSchedule(
  subscriptionId: string,
  localDate: string,
  prayer: PrayerKey,
  messageId: string,
) {
  const store = redis();
  await store.set(scheduleKey(subscriptionId, localDate, prayer), messageId, {
    ex: 60 * 60 * 48,
  });
}

/** Gives the reservation back, so a later run can try the handover again. */
export async function releaseSchedule(
  subscriptionId: string,
  localDate: string,
  prayer: PrayerKey,
) {
  const store = redis();
  await store.del(scheduleKey(subscriptionId, localDate, prayer));
}
