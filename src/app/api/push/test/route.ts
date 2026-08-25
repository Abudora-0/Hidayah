import { NextResponse } from "next/server";

import { sendTestNotification, vapidConfigured } from "@/lib/push-server";
import {
  getSubscription,
  pushStorageConfigured,
  subscriptionId,
} from "@/lib/push-store";

/**
 * Sends one notification to a single subscription, on request.
 *
 * Waiting for the next prayer is a poor way to find out whether delivery
 * works, so this exists to answer that question immediately.
 *
 * The endpoint URL is the credential here. Only the browser holding a
 * subscription can read its own endpoint, and a caller can therefore only
 * reach a subscription it already possesses. Anything not already in the
 * store is refused rather than delivered to.
 */
export async function POST(request: Request) {
  if (!pushStorageConfigured() || !vapidConfigured()) {
    return NextResponse.json(
      {
        error: "Background notifications are not configured on this deployment.",
        code: "notConfigured",
      },
      { status: 503 },
    );
  }

  let endpoint: unknown;
  try {
    ({ endpoint } = (await request.json()) as { endpoint?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "badRequest" }, { status: 400 });
  }

  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json(
      { error: "The push subscription is incomplete.", code: "incomplete" },
      { status: 400 },
    );
  }

  const record = await getSubscription(subscriptionId(endpoint));
  if (!record) {
    return NextResponse.json(
      {
        error: "This device is not subscribed. Turn notifications off and on again.",
        code: "notSubscribed",
      },
      { status: 404 },
    );
  }

  const { result, detail } = await sendTestNotification(record);

  if (result === "sent") return NextResponse.json({ ok: true });

  return NextResponse.json(
    {
      error:
        result === "gone"
          ? "The browser has discarded this subscription. Turn notifications off and on again."
          : `The push service refused the message. ${detail ?? ""}`.trim(),
      code: result === "gone" ? "deliveryGone" : "deliveryFailed",
    },
    { status: 502 },
  );
}
