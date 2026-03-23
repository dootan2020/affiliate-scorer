// POST /api/fastmoss/sync — receives crawled data from FastMoss crawler service
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncProducts } from "@/lib/fastmoss/sync-products";
import { syncCategories } from "@/lib/fastmoss/sync-categories";
import { syncMarket } from "@/lib/fastmoss/sync-market";

interface SyncRequest {
  type: "products" | "categories" | "market";
  region?: string;
  data: unknown[];
  metadata?: Record<string, unknown>;
}

type SyncResult = {
  recordCount: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
};

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Auth: check x-auth-secret header
  const secret = request.headers.get("x-auth-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: SyncRequest;
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.type || !Array.isArray(body.data)) {
    return NextResponse.json({ error: "type and data (array) required" }, { status: 400 });
  }

  const validTypes = ["products", "categories", "market"];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // 3. Create sync log
  const syncLog = await prisma.fastMossSyncLog.create({
    data: {
      syncType: body.type,
      status: "running",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: body.metadata ? (body.metadata as any) : undefined,
    },
  });
  const startTime = Date.now();

  try {
    let result: SyncResult;

    switch (body.type) {
      case "products":
        result = await syncProducts(body.data, syncLog.id);
        break;
      case "categories":
        result = await syncCategories(body.data, body.region ?? "VN", syncLog.id);
        break;
      case "market":
        result = await syncMarket(body.data, syncLog.id);
        break;
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    await prisma.fastMossSyncLog.update({
      where: { id: syncLog.id },
      data: {
        ...result,
        status: "completed",
        duration,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, ...result, duration });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.fastMossSyncLog.update({
      where: { id: syncLog.id },
      data: { status: "failed", errorLog: msg, completedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
