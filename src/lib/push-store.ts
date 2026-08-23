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

/**
 * Marks one prayer on one day as already scheduled.
 *
 * The daily cron enqueues a rolling window, so without this a prayer near the
 * window boundary could be enqueued twice and the user notified twice. Returns
 * true only for the first caller.
 */
export async function claimSchedule(
  subscriptionId: string,
  localDate: string,
  prayer: PrayerKey,
) {
  const store = redis();
  const key = `hidayah:sched:${subscriptionId}:${localDate}:${prayer}`;
  const result = await store.set(key, 1, { nx: true, ex: 60 * 60 * 48 });
  return result === "OK";
}
