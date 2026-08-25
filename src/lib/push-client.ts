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

/**
 * Why enabling or testing failed, as something translatable.
 *
 * The message on the error stays as readable English, so anything that has no
 * translation yet still says something useful rather than showing a key.
 */
export type PushErrorCode =
  | "unsupported"
  | "notConfigured"
  | "permissionDenied"
  | "workerFailed"
  | "badKey"
  | "braveBlocked"
  | "pushServiceUnreachable"
  | "notAllowed"
  | "refused"
  | "saveFailed"
  | "notSubscribed"
  | "incomplete"
  | "badCoordinates"
  | "noPrayers"
  | "badRequest"
  | "deliveryGone"
  | "deliveryFailed";

export class PushError extends Error {
  readonly code: PushErrorCode;
  /** What the platform or the server said, when that adds anything. */
  readonly detail?: string;

  constructor(code: PushErrorCode, message: string, detail?: string) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

/** Whether a subscription was created against the key we are signing with. */
function matchesKey(subscription: PushSubscription, key: Uint8Array) {
  const raw = subscription.options?.applicationServerKey;
  if (!raw) return false;
  const bytes = new Uint8Array(raw as ArrayBuffer);
  if (bytes.length !== key.length) return false;
  return bytes.every((byte, at) => byte === key[at]);
}

/**
 * Calls back when the worker reports that a test push reached this device.
 *
 * Delivery and display are separate steps, and only the worker can see the
 * first. Without this a notification suppressed by the operating system looks
 * exactly like one that never arrived.
 */
export function onTestPushReceived(callback: () => void) {
  if (!pushSupported()) return () => {};
  function handle(event: MessageEvent) {
    if (event.data?.type === "hidayah-test") callback();
  }
  navigator.serviceWorker.addEventListener("message", handle);
  return () => navigator.serviceWorker.removeEventListener("message", handle);
}

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
async function explainSubscribeFailure(caught: unknown): Promise<PushError> {
  const detail = describe(caught);

  if (caught instanceof DOMException && caught.name === "AbortError") {
    if (await isBrave()) {
      return new PushError(
        "braveBlocked",
        "Brave blocks the push service until you allow it. Open " +
          "brave://settings/privacy, turn on \"Use Google services for push " +
          "messaging\", then restart Brave and try again.",
      );
    }
    return new PushError(
      "pushServiceUnreachable",
      "The browser could not reach its push service, so notifications cannot " +
        "be registered. This is usually a browser setting or a network that " +
        "blocks it rather than a fault in Hidayah.",
      detail,
    );
  }

  if (caught instanceof DOMException && caught.name === "NotAllowedError") {
    return new PushError(
      "notAllowed",
      "Notifications are blocked for this site, or by the operating system. " +
        "Allow them for Hidayah in the browser and check that notifications " +
        "are enabled for your browser in system settings.",
    );
  }

  return new PushError(
    "refused",
    "The browser refused the subscription.",
    detail,
  );
}

/**
 * Turns a refusal from our own API into a translatable error.
 *
 * The route names the reason in a code; its English sentence is kept as the
 * message so an untranslated case still reads properly.
 */
async function serverError(
  response: Response,
  fallback: PushErrorCode,
  fallbackMessage: string,
) {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: PushErrorCode;
  };
  return new PushError(body.code ?? fallback, body.error || fallbackMessage);
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
    throw new PushError(
      "unsupported",
      "This browser cannot deliver background notifications.",
    );
  }

  const key = pushPublicKey();
  if (!key) {
    throw new PushError(
      "notConfigured",
      "Background notifications are not configured on this deployment.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new PushError(
      "permissionDenied",
      "Notification permission was declined. You can still use the alarm while the site is open.",
    );
  }

  let registration: ServiceWorkerRegistration | null | undefined;
  try {
    registration = await registerServiceWorker();
  } catch (caught) {
    throw new PushError(
      "workerFailed",
      "The service worker could not be registered.",
      describe(caught),
    );
  }
  if (!registration) {
    throw new PushError(
      "workerFailed",
      "The service worker could not be registered.",
    );
  }

  await navigator.serviceWorker.ready;

  let applicationServerKey: ReturnType<typeof urlBase64ToUint8Array>;
  try {
    applicationServerKey = urlBase64ToUint8Array(key);
  } catch {
    throw new PushError(
      "badKey",
      "The configured VAPID public key is not valid base64url, so this build cannot subscribe.",
    );
  }

  // A subscription left over from an earlier key cannot be delivered to: the
  // push service checks it against the key it was made with. Reusing one is
  // silent breakage, so it is discarded rather than trusted.
  let existing = await registration.pushManager.getSubscription();
  if (existing && !matchesKey(existing, applicationServerKey)) {
    await existing.unsubscribe().catch(() => false);
    existing = null;
  }

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
    throw await explainSubscribeFailure(caught);
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
    throw await serverError(response, "saveFailed", "The subscription could not be saved.");
  }

  // How many prayers were queued right now. Zero is not a failure: it means
  // none of the chosen prayers are still ahead today, and the daily run will
  // pick up tomorrow's. Saying so is better than an unexplained silence.
  const body = (await response.json().catch(() => ({}))) as {
    scheduled?: number;
    scheduling?: boolean;
  };

  return {
    subscription,
    scheduled: body.scheduled ?? 0,
    scheduling: body.scheduling !== false,
  };
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

  // A browser that refuses to let go of a subscription must not leave the
  // control stuck mid flight. The server has already forgotten this device,
  // which is the part that decides whether anything more is delivered.
  await subscription.unsubscribe().catch(() => false);
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
    throw new PushError("notSubscribed", "This device is not subscribed yet.");
  }

  const response = await fetch("/api/push/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  if (!response.ok) {
    throw await serverError(response, "deliveryFailed", "The test notification could not be sent.");
  }
}
