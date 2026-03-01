---
title: "Background Upload Processing"
description: "Fire-and-forget async processing for product/TikTok imports with client polling"
status: completed
priority: P1
effort: 6h
branch: master
tags: [upload, async, polling, performance]
created: 2026-03-02
---

# Background Upload Processing

## Problem

Upload/sync breaks when user switches tab or closes page. All heavy processing (DB lookups, snapshots, identity sync, scoring, lifecycle) runs synchronously inside the HTTP request handler — blocking response for 10-60+ seconds depending on file size.

## Solution

Fire-and-forget + client polling. No external queue. Compatible with Vercel serverless via Next.js `after()` API (stable in Next 16).

## Architecture Overview

```
Client                    Server
  |                         |
  |-- POST /upload -------->|  (parse + validate only)
  |<-- 200 {batchId} -------|
  |                         |--- after() { processProducts() }
  |-- GET /status?id=X ---->|
  |<-- {progress: 10/50} ---|
  |     ... poll 3s ...     |
  |-- GET /status?id=X ---->|
  |<-- {status: completed} -|
```

## Phases

| # | Phase | Status | Est |
|---|-------|--------|-----|
| 1 | [Schema: Add status tracking to ImportBatch](./phase-01-schema-import-batch-status.md) | ✅ Done | 30m |
| 2 | [Refactor product import to async](./phase-02-async-product-import.md) | ✅ Done | 2h |
| 3 | [Polling endpoint](./phase-03-polling-endpoint.md) | ✅ Done | 30m |
| 4 | [Client polling UI](./phase-04-client-polling-ui.md) | ✅ Done | 1.5h |
| 5 | [TikTok Studio async](./phase-05-tiktok-studio-async.md) | ✅ Done | 1.5h |

## Key Dependencies

- Next.js 16.1.6 ships `after()` (stable since Next 15.1) — no extra packages needed
- ImportBatch model needs new fields before other phases
- Phase 2-3 can be developed together; Phase 4 depends on both
- Phase 5 follows same pattern as Phase 2-3, independent of Phase 4

## Key Decisions

1. **`after()` over raw fire-and-forget**: Next.js `after()` is the official API for post-response work. It extends function lifetime past response, works on Vercel, and is cleaner than dangling Promises.
2. **No queue service**: YAGNI. Single-user app, no concurrency concerns. Simple `after()` + DB status polling is sufficient.
3. **Extend ImportBatch, not DataImport**: Product imports use ImportBatch. DataImport is for financial/affiliate data (separate flow). Keep them decoupled.
4. **Store parsed data in memory, not DB**: Parsed product array passed directly to background processor via closure. No need to serialize to DB then re-read.
