import { NextResponse } from "next/server";

import {
  pushStorageConfigured,
  removeSubscription,
  subscriptionId,
} from "@/lib/push-store";

export async function POST(request: Request) {
  if (!pushStorageConfigured()) {
    return NextResponse.json({ ok: true });
  }

  let endpoint: string | undefined;
  try {
    endpoint = ((await request.json()) as { endpoint?: string }).endpoint;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!endpoint) {
    return NextResponse.json({ error: "No endpoint given." }, { status: 400 });
  }

  await removeSubscription(subscriptionId(endpoint));
  return NextResponse.json({ ok: true });
}
