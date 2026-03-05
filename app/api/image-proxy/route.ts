import { NextRequest, NextResponse } from "next/server";

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f3f4f6"/>
  <path d="M80 70a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-30 60l30-30 20 20 20-20 30 30z" fill="#d1d5db"/>
</svg>`;

function placeholderResponse(): NextResponse {
  return new NextResponse(PLACEHOLDER_SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60",
    },
  });
}

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

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const TIMEOUT_MS = 10_000; // 10 giây

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PASTR/1.0)",
        "Referer": "https://www.fastmoss.com/",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return placeholderResponse();
    }

    // Kiểm tra content-length trước khi tải
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      return new NextResponse("Image too large (max 5MB)", { status: 413 });
    }

    const buffer = await response.arrayBuffer();

    // Kiểm tra kích thước thực tế
    if (buffer.byteLength > MAX_SIZE) {
      return new NextResponse("Image too large (max 5MB)", { status: 413 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return placeholderResponse();
  }
}
