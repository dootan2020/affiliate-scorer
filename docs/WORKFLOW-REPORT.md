# WORKFLOW-REPORT.md

> Auto-generated: 2026-02-26 after TASK-5 completion
> Build: `pnpm build` PASS (0 errors)

---

## Section 1: Content Factory Workflow

**Pipeline:** Capture → Inbox → Production → Log → Learn → Report

| Stage | Trigger | Key Models | Key API |
|-------|---------|------------|---------|
| Capture | Paste link / CSV upload | ProductIdentity, InboxItem | /api/inbox/paste, /api/upload/products |
| Enrich | Auto or manual | ProductIdentity (scores, delta) | /api/inbox/[id]/score |
| Produce | Select scored items | ContentBrief, ContentAsset | /api/briefs/batch, /api/production/create-batch |
| Log | Log video results | AssetMetric | /api/log/quick, /api/log/batch, /api/metrics/capture |
| Learn | Auto after enough data | LearningWeightP4, UserPattern | /api/learning/trigger, /api/patterns |
| Report | Weekly / daily brief | WeeklyReport, DailyBrief | /api/reports/weekly, /api/morning-brief |

---

## Section 2: Navigation & Pages

### Active Navigation (7 items)
| Nav Label | Route | Purpose |
|-----------|-------|---------|
| Dashboard | / | Morning brief, quick paste, suggestions, inbox stats, events |
| Inbox | /inbox | Product pipeline with state tabs (new→enriched→scored→briefed→published) |
| Sync | /sync | File upload, TikTok Studio import with column mapping |
| Sản xuất | /production | 3-step: select products → AI generate briefs → export packs |
| Log | /log | Result logging with TikTok metrics, AI pattern learning |
| Thư viện | /library | Content asset library with filters |
| Insights | /insights | Confidence, weekly reports, playbook, calendar |

### Redirect Pages
| Route | Target | Purpose |
|-------|--------|---------|
| /upload | /sync | Legacy URL compat |
| /playbook | /insights?tab=playbook | Tab shortcut |
| /products | /inbox | Legacy URL compat |

### Detail Pages
- /inbox/[id] — Inbox item detail
- /products/[id] — Product detail
- /shops — Shop management (hidden from nav)
- /shops/[id] — Shop detail

---

## Section 3: API Routes (51 endpoints)

| Category | Count | Key Routes |
|----------|-------|------------|
| Inbox & Products | 10 | /api/inbox, /api/inbox/[id], /api/inbox/paste, /api/inbox/score-all, /api/products, /api/library |
| AI & Intelligence | 5 | /api/ai/anomalies, /api/ai/confidence, /api/ai/intelligence, /api/ai/weekly-report, /api/morning-brief |
| Content & Briefs | 4 | /api/briefs/[id], /api/briefs/batch, /api/briefs/generate, /api/brief/today |
| Production & Export | 4 | /api/production/create-batch, /api/production/[batchId], /api/production/[batchId]/export, /api/export/sheet |
| Learning & Patterns | 4 | /api/learning, /api/learning/history, /api/learning/trigger, /api/patterns |
| Financial & Goals | 7 | /api/financial, /api/financial/[id], /api/financial/summary, /api/commissions, /api/goals-p5 |
| Logging & Metrics | 4 | /api/log/quick, /api/log/batch, /api/log/match, /api/metrics/capture |
| Calendar | 3 | /api/calendar, /api/calendar/[id], /api/calendar/upcoming |
| Shops | 2 | /api/shops, /api/shops/[id] |
| Upload & Sync | 4 | /api/upload/products, /api/upload/products/preview, /api/upload/import/history, /api/sync/tiktok-studio |
| Other | 4 | /api/score, /api/reports/weekly, /api/compliance, /api/image-proxy, /api/insights |

---

## Section 4: Database Schema (38 models)

### Active (16)
Product, ProductIdentity, ProductUrl, InboxItem, ContentBrief, ContentAsset, ProductionBatch, AssetMetric, LearningWeightP4, UserPattern, Commission, DailyBrief, GoalP5, AccountDailyStat, FollowerActivity, AccountInsight

### Supporting (14)
Feedback, LearningLog, ProductSnapshot, ImportBatch, DataImport, Shop, FinancialRecord, CalendarEvent, WeeklyReport

### Deprecated (4) — kept for historical data
| Model | Replaced By |
|-------|-------------|
| Campaign | ContentAsset + Commission |
| ContentPost | ContentAsset |
| WinPattern | UserPattern + LearningWeightP4 |
| UserGoal | GoalP5 |

**Deprecated model queries:** 0 remaining in codebase (verified via grep).

---

## Section 5: Open Issues

### 5.1 — INFO: 19 component files exceed 200-line guideline

| File | Lines |
|------|-------|
| components/log/log-page-client.tsx | 475 |
| components/production/brief-preview-card.tsx | 284 |
| components/production/production-page-client.tsx | 273 |
| components/ui/dropdown-menu.tsx | 257 |
| components/shops/shop-create-modal.tsx | 253 |
| components/dashboard/morning-brief-widget.tsx | 248 |
| components/insights/overview-tab.tsx | 239 |
| components/insights/insights-page-client.tsx | 238 |
| components/library/library-page-client.tsx | 234 |
| components/insights/calendar-event-form.tsx | 230 |
| components/sync/tiktok-studio-dropzone.tsx | 223 |
| components/products/product-table.tsx | 222 |
| components/shops/shop-edit-form.tsx | 216 |
| components/inbox/quick-enrich-modal.tsx | 210 |
| components/ai/playbook-section.tsx | 205 |
| components/upload/column-mapping.tsx | 204 |
| components/products/affiliate-link-section.tsx | 202 |
| components/playbook/playbook-page-client.tsx | 202 |
| components/insights/calendar-events-list.tsx | 201 |

Recommendation: Prioritize `log-page-client.tsx` (475 lines) for modularization. Others are borderline and can be addressed during feature work.

### 5.2 — INFO: lib/ai/scoring.ts has duplicate logic (288 lines)

`scoreProducts()` and `scoreAllProducts()` share ~80% identical code (batch processing, merge with base score, DB write, rank update). Consolidate into single configurable function with `includeAlreadyScored` flag.

### 5.3 — INFO: 4 lib files over 200 lines

| File | Lines |
|------|-------|
| lib/ai/scoring.ts | 288 |
| lib/scoring/formula.ts | 272 |
| lib/reports/generate-weekly-report.ts | 233 |
| lib/content/generate-brief.ts | 203 |

`formula.ts` is fine (7 scoring functions, each distinct). Others are borderline.

---

## Section 6: Build & Deploy

- **Build:** `pnpm build` PASS — 0 TypeScript errors
- **Routes:** 51 API + 15 pages (7 primary + 3 redirect + 5 detail)
- **Stack:** Next.js 16.1.6, React 19.2.3, Prisma 7.4.1, PostgreSQL (Supabase), Anthropic SDK 0.78.0
- **Deploy:** Vercel (affiliate-scorer.vercel.app)
- **Auth:** 3-layer middleware (AUTH_SECRET header, same-origin, Next.js internal)
- **Schema:** 38 models (4 deprecated, 0 deprecated queries remaining)
- **Env vars:** DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY, AUTH_SECRET
