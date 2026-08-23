import { NextResponse } from "next/server";

import { OBLIGATORY_PRAYERS, type PrayerKey } from "@/lib/prayer";
import {
  pushStorageConfigured,
  saveSubscription,
  subscriptionId,
} from "@/lib/push-store";
import { vapidConfigured } from "@/lib/push-server";

type Body = {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  latitude?: number;
  longitude?: number;
  timeZone?: string;
  method?: string;
  madhab?: string;
  prayers?: string[];
};

export async function POST(request: Request) {
  if (!pushStorageConfigured() || !vapidConfigured()) {
    return NextResponse.json(
      {
        error:
          "Background notifications are not configured on this deployment. The in tab alarm still works while the site is open.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "The push subscription is incomplete." },
      { status: 400 },
    );
  }

  if (
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number" ||
    Math.abs(body.latitude) > 90 ||
    Math.abs(body.longitude) > 180
  ) {
    return NextResponse.json(
      { error: "Valid coordinates are required to compute prayer times." },
      { status: 400 },
    );
  }

  const prayers = (body.prayers ?? []).filter((p): p is PrayerKey =>
    (OBLIGATORY_PRAYERS as string[]).includes(p),
  );

  if (prayers.length === 0) {
    return NextResponse.json(
      { error: "Choose at least one prayer to be notified about." },
      { status: 400 },
    );
  }

  const id = subscriptionId(endpoint);

  await saveSubscription({
    id,
    endpoint,
    keys: { p256dh, auth },
    latitude: body.latitude,
    longitude: body.longitude,
    timeZone: body.timeZone || "UTC",
    method: (body.method as never) ?? "Karachi",
    madhab: (body.madhab as never) ?? "hanafi",
    prayers,
    createdAt: Date.now(),
  });

  return NextResponse.json({ id, prayers });
}
