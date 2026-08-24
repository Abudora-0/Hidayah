import { ImageResponse } from "next/og";

import { BrandIcon } from "@/lib/brand-icon";

/**
 * Fixed icon URLs for the web app manifest.
 *
 * The metadata file conventions generate hashed URLs, which a manifest cannot
 * reference reliably, so these are served from a route with a stable path.
 */
const ALLOWED = new Set([192, 512]);

export function generateStaticParams() {
  return [...ALLOWED].map((size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/icons/[size]">,
) {
  const { size } = await params;
  const dimension = Number(size);

  if (!ALLOWED.has(dimension)) {
    return new Response("Not found", { status: 404 });
  }

  // The maskable variant keeps its plate, since a maskable icon must fill its
  // safe area and a transparent one renders as a black tile on a home screen.
  const maskable = new URL(_request.url).searchParams.get("maskable") === "1";

  return new ImageResponse(
    <BrandIcon size={dimension} plate={maskable} />,
    { width: dimension, height: dimension },
  );
}
