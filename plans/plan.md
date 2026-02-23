# Plan: Hoàn thiện AffiliateScorer

## Trạng thái hiện tại
- **Đã xong**: 90% — Parsers, AI Engine, Scoring, Learning, UI/UX, Dark mode, Responsive
- **Còn thiếu**: 5 issues (2 bugs + 3 features thiếu)

## Phases

| Phase | Nội dung | Status | Priority |
|-------|---------|--------|----------|
| 1 | Fix overallSuccess bug + contentFitScore | Pending | Critical |
| 2 | Trang Products list + Google Sheet export | Pending | High |
| 3 | Seed data demo + verify build | Pending | Medium |

---

## Phase 1: Fix Critical Bugs (Bug fixes)

### 1.1 Fix `overallSuccess` hardcoded = "moderate"
**File**: `app/api/upload/feedback/route.ts`
**Vấn đề**: Line 74 hardcode `overallSuccess: "moderate"` cho mọi feedback. Learning engine dùng `=== "success"` nên không bao giờ có success.
**Fix**: Tính `overallSuccess` từ dữ liệu thật:
- FB Ads / TikTok Ads: ROAS >= 2 → "success", ROAS >= 1 → "moderate", else "poor"
- Shopee Affiliate: orders > 0 && conversionRate >= 2% → "success", orders > 0 → "moderate", else "poor"
- Fallback: "moderate"

Cũng cần cập nhật learning engine check: `"success"` ← phải khớp enum mới.

### 1.2 Fix `contentFitScore` hardcoded = 50
**File**: `lib/scoring/formula.ts`
**Vấn đề**: Line 95 hardcode `contentFitScore = 50`. PRD nói AI đánh giá.
**Fix**: Tính dựa trên product attributes:
- Category hot (beauty, health, tech, fashion) → +20
- Price 150-500K (sweet spot cho video content) → +15
- Có growth > 100% (viral potential) → +15
- Base: 50
- Cap ở 100

---

## Phase 2: Missing Features

### 2.1 Trang Products list (`app/products/page.tsx`)
- Server component, fetch all products with pagination
- Filter by: category, scored/unscored, platform
- Sort by: aiScore, price, commissionRate, date
- Reuse ProductTable component
- Link từ nav

### 2.2 Google Sheet Export (`app/api/export/sheet/route.ts`)
- Xuất top products thành CSV download (thay vì Google Sheets API để tránh OAuth complexity)
- Endpoint: GET /api/export/sheet?format=csv
- Fields: rank, name, score, price, commission, platform, category, contentSuggestion

---

## Phase 3: Demo Data + Final Verification

### 3.1 Seed data (`prisma/seed.ts`)
- 10-15 demo products (đa category, đa platform)
- 5-8 demo feedbacks với overallSuccess đa dạng
- 1 demo LearningLog
- Update package.json prisma.seed

### 3.2 Final Build Verification
- `pnpm build` → pass
- Commit all changes
