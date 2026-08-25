"use client";

import type { StoredLocation } from "./location";
import type { MadhabKey, MethodKey, PrayerKey } from "./prayer";

/** The VAPID public key is safe to expose. Absent means push is not set up. */
export function pushPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Web Push wants the key as a byte array, not the base64url string. */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalised);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export class PushError extends Error {}

/**
 * Brave turns Google's push service off by default, and every subscription
 * attempt then fails with the same opaque AbortError. Knowing the browser is
 * the difference between a dead end and a setting to change.
 */
async function isBrave() {
  const nav = navigator as Navigator & {
    brave?: { isBrave?: () => Promise<boolean> };
  };
  try {
    return (await nav.brave?.isBrave?.()) === true;
  } catch {
    return false;
  }
}

/**
 * Turns a refusal from the push service into something actionable.
 *
 * An AbortError here almost never means the page did anything wrong. It means
 * the browser could not reach the service that delivers pushes, which is a
 * setting or a network, so the message points at those.
 */
async function explainSubscribeFailure(caught: unknown) {
  const detail = describe(caught);

  if (caught instanceof DOMException && caught.name === "AbortError") {
    if (await isBrave()) {
      return (
        "Brave blocks the push service until you allow it. Open " +
        "brave://settings/privacy, turn on \"Use Google services for push " +
        "messaging\", then restart Brave and try again."
      );
    }
    return (
      "The browser could not reach its push service, so notifications cannot " +
      "be registered. This is usually a browser setting or a network that " +
      `blocks it rather than a fault in Hidayah. (${detail})`
    );
  }

  if (caught instanceof DOMException && caught.name === "NotAllowedError") {
    return (
      "Notifications are blocked for this site, or by the operating system. " +
      "Allow them for Hidayah in the browser and check that notifications " +
      "are enabled for your browser in system settings."
    );
  }

  return `The browser refused the subscription. ${detail}`;
}

/** Whatever the platform threw, in a form worth showing someone. */
function describe(caught: unknown) {
  if (caught instanceof DOMException) {
    return `${caught.name}: ${caught.message}`;
  }
  if (caught instanceof Error) return caught.message;
  return String(caught);
}

type EnableArgs = {
  location: StoredLocation;
  method: MethodKey;
  madhab: MadhabKey;
  prayers: PrayerKey[];
};

/**
 * Turns on background notifications.
 *
 * This is the only point at which the user's coordinates leave the device. The
 * server needs them because it computes prayer times when no browser is
 * running. The control that calls this says so in plain language.
 */
export async function enablePush({
  location,
  method,
  madhab,
  prayers,
}: EnableArgs) {
  if (!pushSupported()) {
    throw new PushError("This browser cannot deliver background notifications.");
  }

  const key = pushPublicKey();
  if (!key) {
    throw new PushError(
      "Background notifications are not configured on this deployment.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new PushError(
      "Notification permission was declined. You can still use the alarm while the site is open.",
    );
  }

  let registration: ServiceWorkerRegistration | null | undefined;
  try {
    registration = await registerServiceWorker();
  } catch (caught) {
    throw new PushError(
      `The service worker could not be registered. ${describe(caught)}`,
    );
  }
  if (!registration) {
    throw new PushError("The service worker could not be registered.");
  }

  await navigator.serviceWorker.ready;

  let applicationServerKey: ReturnType<typeof urlBase64ToUint8Array>;
  try {
    applicationServerKey = urlBase64ToUint8Array(key);
  } catch {
    throw new PushError(
      "The configured VAPID public key is not valid base64url, so this build cannot subscribe.",
    );
  }

  const existing = await registration.pushManager.getSubscription();
  let subscription: PushSubscription;
  try {
    subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));
  } catch (caught) {
    // The browser refuses for reasons it will only state in the exception,
    // and hiding that behind a generic sentence leaves nothing to act on.
    throw new PushError(await explainSubscribeFailure(caught));
  }

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      latitude: location.latitude,
      longitude: location.longitude,
      timeZone: location.timeZone,
      method,
      madhab,
      prayers,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new PushError(body.error || "The subscription could not be saved.");
  }

  return subscription;
}

export async function disablePush() {
  const subscription = await currentSubscription();
  if (!subscription) return;

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => {
    // Even if the server call fails, unsubscribing locally is the right thing.
  });

  await subscription.unsubscribe();
}

/**
 * Asks the server to deliver a single notification to this device.
 *
 * Whether a push actually arrives depends on the browser, the operating
 * system and the push service, none of which the page can inspect, so the
 * only honest test is to send one and look.
 */
export async function sendTestPush() {
  const subscription = await currentSubscription();
  if (!subscription) {
    throw new PushError("This device is not subscribed yet.");
  }

  const response = await fetch("/api/push/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new PushError(body.error || "The test notification could not be sent.");
  }
}
