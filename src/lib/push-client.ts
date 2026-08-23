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

  const registration = await registerServiceWorker();
  if (!registration) {
    throw new PushError("The service worker could not be registered.");
  }

  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));

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
