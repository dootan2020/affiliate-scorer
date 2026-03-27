# Plan: Extension Export XLSX Mode

**Created:** 2026-03-27
**Status:** Draft
**Complexity:** Medium (4 phases)

## Summary

Add "Export Crawl" mode to PASTR Chrome Extension. Instead of intercepting API responses (10-30 SP/category), auto-click FastMoss's "Xuất dữ liệu" button to export XLSX (300 SP/category). Upload XLSX to PASTR backend which already has a FastMoss parser.

## Approach: Blob Interception (No Downloads API)

Instead of using `chrome.downloads` + Offscreen Document (complex MV3 workaround), we intercept the XLSX blob BEFORE download by patching `URL.createObjectURL` in MAIN world. This captures the file in-memory without touching the filesystem.

```
FastMoss click "Xuất dữ liệu"
  → SPA generates XLSX blob
  → URL.createObjectURL(blob) called
  → injected.js intercepts → reads blob as dataURL
  → postMessage → content.js → background.js
  → background.js uploads FormData to PASTR
  → PASTR parses XLSX → upserts products
```

## Numbers

| Metric | Current (Intercept) | Target L1 (Export) | Target L2 |
|--------|--------------------|--------------------|-----------|
| SP/category | ~35 | 300 | 300 |
| Categories | 28 | 29 | ~200 |
| Total SP | 1,017 | 8,700 | ~30,000 (dedup) |

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Blob interception + backend endpoint | Pending | [phase-01](phase-01-blob-intercept-and-backend.md) |
| 2 | Export crawl mode in background.js | Pending | [phase-02](phase-02-export-crawl-mode.md) |
| 3 | Popup UI + progress tracking | Pending | [phase-03](phase-03-popup-and-progress.md) |
| 4 | L2 subcategory support | Pending | [phase-04](phase-04-l2-subcategories.md) |

## Key Decisions

1. **Blob interception over Downloads API** — No Offscreen Document needed, simpler MV3 compat
2. **New /api/fastmoss/sync-xlsx endpoint** — Reuses existing `parseFastMoss()` parser + `syncProducts()` upsert, adds auth via x-auth-secret
3. **Keep both modes** — Intercept (passive browse) + Export (active crawl)
4. **NormalizedProduct → syncProducts bridge** — Convert XLSX parser output to raw format for existing upsert pipeline

## Risks

| Risk | Mitigation |
|------|------------|
| FastMoss CSP blocks blob interception | Fallback: use `chrome.downloads` API + Offscreen Document |
| Export quota limit reached | Track quota, pause crawl, resume next day |
| FastMoss changes export button | Multiple selector strategies (text, aria, icon) |
| Large blob in postMessage | 300-row XLSX ≈ 100-200KB, well within limits |
| FastMoss requires confirm dialog | Auto-click confirm if dialog appears |
