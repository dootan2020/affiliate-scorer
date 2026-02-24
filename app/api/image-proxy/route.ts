import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side image proxy to bypass hotlink protection.
 * Usage: /api/image-proxy?url=https://s.500fd.com/...
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Only allow proxying from known domains
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("500fd.com")) {
      return new NextResponse("Domain not allowed", { status: 403 });
    }
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AffiliateScorer/1.0)",
        "Referer": "https://www.fastmoss.com/",
      },
    });

    if (!response.ok) {
      return new NextResponse("Image fetch failed", { status: response.status });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}
