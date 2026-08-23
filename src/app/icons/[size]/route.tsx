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

  return new ImageResponse(<BrandIcon size={dimension} />, {
    width: dimension,
    height: dimension,
  });
}
