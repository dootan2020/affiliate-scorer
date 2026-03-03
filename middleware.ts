// Middleware: Bảo vệ API routes khỏi truy cập trái phép
// Personal tool → chặn request từ bên ngoài, cho phép same-origin
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_PATHS = [
  "/api/image-proxy", // Needed for img src
  "/api/internal/",   // Server-to-server relay (import-chunk, score-batch)
  "/api/cron/",       // Vercel cron jobs
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Only protect /api routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow public API paths
  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  // Allow GET requests from browser (page loads, fetch from same origin)
  // Protect POST/PATCH/DELETE from external sources
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return NextResponse.next();
  }

  // Check 1: AUTH_SECRET header (for external/programmatic access)
  const authSecret = process.env.AUTH_SECRET;
  const headerSecret = request.headers.get("x-auth-secret");
  if (authSecret && headerSecret === authSecret) {
    return NextResponse.next();
  }

  // Check 2: Same-origin check via Origin/Referer header
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (host) {
    const allowedOrigins = [
      `http://${host}`,
      `https://${host}`,
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    if (origin && allowedOrigins.some((o) => origin.startsWith(o))) {
      return NextResponse.next();
    }

    if (referer && allowedOrigins.some((o) => referer.startsWith(o))) {
      return NextResponse.next();
    }
  }

  // Check 3: Next.js internal requests (server components calling API routes)
  const isNextInternal = request.headers.get("x-nextjs-data") !== null
    || request.headers.get("rsc") !== null;
  if (isNextInternal) {
    return NextResponse.next();
  }

  // Blocked
  return NextResponse.json(
    { error: "Không có quyền truy cập. Thêm header x-auth-secret hoặc gọi từ ứng dụng." },
    { status: 401 },
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
