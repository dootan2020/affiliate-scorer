# Phase 8 — Env Check + Security + Workflow Report

**Priority:** Medium (final step)
**Status:** ⏳ Pending
**Depends on:** Phase 7 (all features done)
**TASKS.md ref:** Task 7 + Lưu ý bổ sung

---

## Overview

Three parts:
1. Environment variables audit
2. Security (.env cleanup)
3. Workflow report (`docs/WORKFLOW-REPORT.md`)

---

## Part 1: Env Variables Audit

### Steps
1. [ ] Run `vercel env ls` to check existing vars (names only, NOT values)
2. [ ] Compare against `.env.example` — identify missing vars
3. [ ] Required vars:
   - `DATABASE_URL` — PostgreSQL connection
   - `ANTHROPIC_API_KEY` — Claude API
   - `NEXT_PUBLIC_BASE_URL` — Production URL
4. [ ] If ANTHROPIC_API_KEY missing on Vercel → instruct user to add via `vercel env add`
5. [ ] /production page: if API key missing → show clear message, not crash

---

## Part 2: .env Security

### Steps
6. [ ] Check if `.env` contains real API keys (not `.env.local`)
7. [ ] If yes: move secrets to `.env.local`
8. [ ] Ensure `.env.local` is in `.gitignore`
9. [ ] Clean `.env` to only have non-secret defaults
10. [ ] NEVER read .env file content to extract key values

---

## Part 3: /log Page Note

### Steps
11. [ ] Keep manual metrics entry on /log page
12. [ ] Add note/banner: "Hoặc upload file TikTok Studio ở trang Sync để tự động cập nhật hàng loạt"
13. [ ] Link from note → /sync

---

## Part 4: Workflow Report

### File: `docs/WORKFLOW-REPORT.md`

Must reflect ACTUAL state of code after all changes. Content:

#### 4.1 Workflow Diagrams
- Full user flow: Sync → Inbox → Score → Brief → Production → Publish → Log → Learn
- Data flow: which tables/APIs involved at each step

#### 4.2 Page Audit
For each page:
- Route path
- Purpose/function
- Data sources (which Prisma models/API routes)
- Output (what user sees/does)
- Links to other pages

Pages to audit: Dashboard, Inbox, Sync, Production, Log, Library, Insights

#### 4.3 Database Audit
- All active models with purpose
- Key relationships
- Models that are deprecated/unused

#### 4.4 API Audit
- All active endpoints
- Method, purpose, data model
- Endpoints that are deprecated/removed

#### 4.5 Issues Found
- Any broken flows
- Logic inconsistencies
- UI issues discovered
- Missing features
- Data integrity concerns

---

## Implementation Steps

1. [ ] Run `vercel env ls` and document findings
2. [ ] Check .env vs .env.local security
3. [ ] Add note to /log page about Sync
4. [ ] Scan entire codebase systematically:
   - All pages (app/*/page.tsx)
   - All API routes (app/api/*)
   - All Prisma models
   - All component connections
5. [ ] Write `docs/WORKFLOW-REPORT.md` based on scan results
6. [ ] Cross-reference: does each page's data source actually exist?
7. [ ] Identify any broken links, missing endpoints, dead code

---

## Workflow Report Template

```markdown
# Workflow Report — AI Content Factory

> Trạng thái thực tế của hệ thống sau refactor
> Ngày: [date]

## 1. Luồng Workflow Chính

### Capture → Enrich → Score → Brief → Produce → Publish → Learn

[Diagram]

### Data Flow
[Mỗi bước: input → xử lý → output → lưu ở đâu]

## 2. Trang & Chức Năng

### /dashboard
- Chức năng: [...]
- Data sources: [...]
- Links đến: [...]

### /inbox
[...]

## 3. Database

| Model | Mục đích | Quan hệ |
|-------|---------|---------|
| ... | ... | ... |

## 4. API Endpoints

| Route | Method | Mô tả | Model |
|-------|--------|-------|-------|
| ... | ... | ... | ... |

## 5. Vấn Đề Phát Hiện

| # | Loại | Mô tả | Mức độ |
|---|------|-------|--------|
| ... | ... | ... | ... |
```

---

## Success Criteria

- [ ] Env vars verified on Vercel
- [ ] .env file clean (no secrets)
- [ ] .env.local in .gitignore
- [ ] /log has Sync note
- [ ] `docs/WORKFLOW-REPORT.md` written
- [ ] Report covers all 5 sections
- [ ] Report reflects actual code state, not desired state
- [ ] All issues documented honestly

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Missing env var causes production crash | Check each var systematically |
| Report misses broken flow | Test each workflow manually |
