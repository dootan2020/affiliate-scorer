# Phase 1: Blob Interception + Backend Endpoint

**Priority:** Critical — foundation for all other phases
**Effort:** ~2 hours
**Status:** Pending

## Overview

Two parallel tracks:
1. Extension: intercept XLSX blob in MAIN world before download
2. Backend: new endpoint to receive XLSX + parse + upsert

## Context Links

- Research: `plans/reports/fastmoss-export-research.md`
- Existing parser: `lib/parsers/fastmoss.ts` (20-column Vietnamese XLSX mapping)
- Existing sync: `lib/fastmoss/sync-products.ts` (upsert pipeline)
- Existing parse-file: `lib/parsers/parse-file.ts` (XLSX reading)

## 1. Extension: Blob Interception

### Modify: `extensions/pastr-fastmoss-capture/injected.js`

Add blob interception AFTER existing fetch/XHR patches:

```javascript
// === BLOB INTERCEPTION (for XLSX export capture) ===
const origCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(obj) {
  const url = origCreateObjectURL.call(this, obj);

  // Detect XLSX blobs (spreadsheet MIME type)
  if (obj instanceof Blob && (
    obj.type.includes('spreadsheet') ||
    obj.type.includes('excel') ||
    obj.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    obj.type === 'application/octet-stream'
  )) {
    // Read blob as dataURL and send to content script
    const reader = new FileReader();
    reader.onload = () => {
      window.postMessage({
        type: '__PASTR_EXPORT__',
        dataUrl: reader.result,
        size: obj.size,
        mimeType: obj.type,
        timestamp: Date.now(),
      }, '*');
    };
    reader.readAsDataURL(obj);
  }

  return url;
};
```

**Why `URL.createObjectURL`?** FastMoss SPAs typically generate XLSX client-side (SheetJS), create a blob, then trigger download via `<a>` tag click. Patching at the blob URL level catches all download patterns.

**Fallback for `application/octet-stream`:** Some sites don't set the correct MIME type. Filter by file size (XLSX > 5KB, < 10MB) if MIME is generic.

### Modify: `extensions/pastr-fastmoss-capture/content.js`

Add listener for export events alongside existing capture listener:

```javascript
// Handle XLSX export blob from MAIN world
if (event.data?.type === '__PASTR_EXPORT__') {
  chrome.runtime.sendMessage({
    type: 'XLSX_EXPORT',
    payload: {
      dataUrl: event.data.dataUrl,
      size: event.data.size,
      timestamp: event.data.timestamp,
    }
  });
  return;
}
```

### Modify: `extensions/pastr-fastmoss-capture/background.js`

Add message handler for XLSX uploads:

```javascript
if (msg.type === 'XLSX_EXPORT') {
  handleXlsxExport(msg.payload).then(result => {
    sendResponse(result);
  });
  return true;
}

async function handleXlsxExport(payload) {
  const secret = await getConfig('pastr_auth_secret');
  if (!secret) return { ok: false, error: 'No auth secret' };

  const url = (await getConfig('pastr_url')) || PASTR_URL;

  // Convert dataURL to blob
  const response = await fetch(payload.dataUrl);
  const blob = await response.blob();

  // Upload as multipart form
  const formData = new FormData();
  formData.append('file', blob, `fastmoss-export-${Date.now()}.xlsx`);

  // Attach category context if available from crawl state
  if (crawlState.active && crawlState.categories[crawlState.currentCategoryIndex]) {
    formData.append('category_code', String(crawlState.categories[crawlState.currentCategoryIndex]));
  }

  try {
    const res = await fetch(`${url}/api/fastmoss/sync-xlsx`, {
      method: 'POST',
      headers: { 'x-auth-secret': secret },
      body: formData,
    });
    const result = await res.json();
    console.log('[PASTR] XLSX sync:', result);

    syncCount++;
    lastSyncTime = Date.now();
    captureCount += result.recordCount || 0;
    if (crawlState.active) crawlState.captured += result.newCount || 0;

    updateBadge();
    return { ok: true, ...result };
  } catch (err) {
    console.error('[PASTR] XLSX sync error:', err.message);
    return { ok: false, error: err.message };
  }
}
```

## 2. Backend: New Sync-XLSX Endpoint

### Create: `app/api/fastmoss/sync-xlsx/route.ts`

```typescript
// POST /api/fastmoss/sync-xlsx — receive XLSX from extension, parse, upsert
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFastMoss } from "@/lib/parsers/fastmoss";
import { parseFile } from "@/lib/parsers/parse-file";
import { syncProducts } from "@/lib/fastmoss/sync-products";

export async function POST(request: Request): Promise<NextResponse> {
  // Auth
  const secret = request.headers.get("x-auth-secret");
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const categoryCode = formData.get("category_code") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Create sync log
  const syncLog = await prisma.fastMossSyncLog.create({
    data: {
      syncType: "products",
      status: "running",
      metadata: { source: "xlsx-export", categoryCode } as any,
    },
  });
  const startTime = Date.now();

  try {
    // Parse XLSX → NormalizedProduct[]
    const buffer = Buffer.from(await file.arrayBuffer());
    const { headers, rows } = parseFile(buffer, file.name);
    const products = parseFastMoss(rows);

    // Convert NormalizedProduct → raw format for syncProducts
    const rawProducts = products.map(p => ({
      product_id: extractProductId(p.fastmossUrl) || `xlsx-${p.name}-${Date.now()}`,
      title: p.name,
      cover: p.imageUrl,
      price_vnd: p.price,
      commission_rate_num: p.commissionRate,
      shop_name: p.shopName,
      category_name: p.category ? [p.category] : [],
      category_id: categoryCode ? parseInt(categoryCode, 10) : undefined,
      day28_sold_count: p.sales7d, // 7d as proxy when 28d unavailable
      sale_amount: p.revenueTotal,
      relate_author_count: p.totalKOL,
      relate_video_count: p.totalVideos,
      relate_live_count: p.totalLivestreams,
      product_rating: undefined,
      is_promoted: false,
      // XLSX-specific: use TikTok URL as fallback ID
      _tiktok_url: p.tiktokUrl,
      _crawl_category_id: categoryCode ? parseInt(categoryCode, 10) : undefined,
    }));

    const result = await syncProducts(rawProducts, syncLog.id);
    const duration = Math.round((Date.now() - startTime) / 1000);

    await prisma.fastMossSyncLog.update({
      where: { id: syncLog.id },
      data: { ...result, status: "completed", duration, completedAt: new Date() },
    });

    return NextResponse.json({ success: true, ...result, duration, source: "xlsx" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.fastMossSyncLog.update({
      where: { id: syncLog.id },
      data: { status: "failed", errorLog: msg, completedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Extract product ID from FastMoss URL like /e-commerce/detail/1234567890 */
function extractProductId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/detail\/(\d+)/);
  return match ? match[1] : null;
}
```

### Key: NormalizedProduct → Raw Format Bridge

The existing `parseFastMoss()` returns `NormalizedProduct[]` with fields like `name`, `price`, `commissionRate`. But `syncProducts()` expects raw API objects with fields like `product_id`, `price_vnd`, `commission_rate_num`.

The bridge in the endpoint maps between these formats. The `product_id` is extracted from the FastMoss URL column (`/detail/XXXXX`).

## Files to Modify/Create

| Action | File | Change |
|--------|------|--------|
| Modify | `extensions/.../injected.js` | Add `URL.createObjectURL` patch |
| Modify | `extensions/.../content.js` | Add `__PASTR_EXPORT__` handler |
| Modify | `extensions/.../background.js` | Add `XLSX_EXPORT` handler + upload function |
| Create | `app/api/fastmoss/sync-xlsx/route.ts` | New endpoint |

## Success Criteria

- [ ] Manual test: open FastMoss search page, click "Xuất dữ liệu" → blob intercepted
- [ ] XLSX uploaded to PASTR → products parsed → upserted with correct fields
- [ ] Category code passed through from extension → stored on products
- [ ] Sync log created with source="xlsx-export"

## Testing

1. Load extension in Chrome
2. Open FastMoss search page (Pro account)
3. Click "Xuất dữ liệu" manually
4. Check extension console: should log "[PASTR] XLSX sync: { success: true, ... }"
5. Check PASTR: `/api/fastmoss/status` should show new sync log
