import { NextResponse } from "next/server";

import { describeQueue, schedulingConfigured } from "@/lib/push-schedule";
import { vapidConfigured } from "@/lib/push-server";
import {
  getSubscription,
  pushStorageConfigured,
  subscriptionId,
} from "@/lib/push-store";

/**
 * What is waiting to be delivered to one device.
 *
 * The count used to be reported only in the reply to subscribing, so it was
 * gone by the next reload, which is precisely when someone wants to know
 * whether anything is actually going to arrive. This can be asked at any time.
 *
 * As with the test route, the endpoint is the credential: only the browser
 * holding a subscription can read its own endpoint, so a caller can only ask
 * about a subscription it already has.
 */
export async function POST(request: Request) {
  if (!pushStorageConfigured() || !vapidConfigured()) {
    return NextResponse.json(
      { error: "Background notifications are not configured on this deployment." },
      { status: 503 },
    );
  }

  let endpoint: unknown;
  try {
    ({ endpoint } = (await request.json()) as { endpoint?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json(
      { error: "The push subscription is incomplete." },
      { status: 400 },
    );
  }

  const record = await getSubscription(subscriptionId(endpoint));
  if (!record) {
    return NextResponse.json(
      { error: "This device is not subscribed.", code: "notSubscribed" },
      { status: 404 },
    );
  }

  const queue = await describeQueue(record);

  return NextResponse.json({ ...queue, scheduling: schedulingConfigured() });
}
