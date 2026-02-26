# PLAN-UI-OVERHAUL.md

> Created: 2026-02-26 | Status: PENDING APPROVAL

---

## 1. Tổng quan thay đổi

- **Phase 1:** Trang Settings — chọn AI model theo tác vụ, lưu vào DB
- **Phase 2:** Fix ảnh sản phẩm — 2 component dùng raw `<Image>` thay vì `ProductImage` proxy wrapper
- **Phase 3:** Design overhaul — font, colors (cam Claude), spacing, dark mode
- **Phase 4:** Fix tiếng Việt — TEST-RESULTS.md có output cũ, source code đã đúng dấu

---

## 2. Design Tokens

### 2A. Color Palette — Claude Orange

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| **Primary** | `#E87B35` (oklch 0.68 0.15 55) | `#FF8F47` | Buttons, links, active nav, accents |
| **Primary hover** | `#C86A2B` | `#E87B35` | Button hover, link hover |
| **Primary light bg** | `#FEF3EB` (orange-50) | `rgba(232,123,53,0.1)` | Badges, active tab bg, highlights |
| **Primary text on light bg** | `#B45A1E` | `#FFB088` | Badge text, active tab text |
| **Background** | `#F9FAFB` (gray-50) | `#030712` (slate-950) | Page background |
| **Surface (card)** | `#FFFFFF` | `#0F172A` (slate-900) | Cards, popover |
| **Text primary** | `#111827` (gray-900) | `#F9FAFB` (gray-50) | Headings, body |
| **Text secondary** | `#6B7280` (gray-500) | `#9CA3AF` (gray-400) | Labels, captions |
| **Text muted** | `#9CA3AF` (gray-400) | `#6B7280` (gray-500) | Timestamps, hints |
| **Border** | `#E5E7EB` (gray-200) | `rgba(255,255,255,0.1)` | Card borders, dividers |
| **Success** | `#059669` / bg `#ECFDF5` | `#34D399` / bg `rgba(52,211,153,0.1)` | Positive metrics |
| **Warning** | `#D97706` / bg `#FFFBEB` | `#FBBF24` / bg `rgba(251,191,36,0.1)` | Caution states |
| **Destructive** | `#DC2626` / bg `#FEF2F2` | `#F87171` / bg `rgba(248,113,113,0.1)` | Errors, delete |

### 2B. Typography

| Element | Font | Size | Weight | Line-height |
|---------|------|------|--------|-------------|
| **Font family** | Be Vietnam Pro | — | — | — |
| **H1 (page title)** | Be Vietnam Pro | 28px (text-[28px]) | 600 (semibold) | 1.2 |
| **H2 (section title)** | Be Vietnam Pro | 22px (text-[22px]) | 600 (semibold) | 1.3 |
| **H3 (card title)** | Be Vietnam Pro | 18px (text-lg) | 500 (medium) | 1.4 |
| **Body** | Be Vietnam Pro | 15px (text-[15px]) | 400 (normal) | 1.6 |
| **Body small** | Be Vietnam Pro | 14px (text-sm) | 400 (normal) | 1.5 |
| **Caption** | Be Vietnam Pro | 12px (text-xs) | 400 (normal) | 1.4 |
| **Monospace** | Geist Mono | inherit | — | — |

### 2C. Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| **Card padding** | 24px (p-6) | All cards |
| **Section gap** | 24px (gap-6) | Between cards/sections |
| **Card radius** | 16px (rounded-2xl) | Cards, modals |
| **Button radius** | 12px (rounded-xl) | All buttons |
| **Input radius** | 12px (rounded-xl) | Inputs, selects |
| **Badge radius** | 9999px (rounded-full) | Badges, pills |
| **Table row height** | 52px min (py-3.5) | Table rows |

### 2D. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| **Card default** | `0 1px 3px rgba(0,0,0,0.05)` (shadow-sm) | Cards at rest |
| **Card hover** | `0 4px 12px rgba(0,0,0,0.08)` (shadow-md) | Cards on hover |
| **Button** | `0 1px 2px rgba(0,0,0,0.05)` (shadow-sm) | Primary buttons |

---

## 3. Danh sách file cần sửa

### Phase 1: Settings Page (12 files)

| File | Thay đổi |
|------|----------|
| `prisma/schema.prisma` | Thêm model `AiModelConfig` (taskType, modelId, createdAt, updatedAt) |
| `lib/ai/claude.ts` | Thêm param `modelOverride?: string` vào `callClaude()`. Thêm `getModelForTask(taskType)` helper đọc DB, fallback default |
| `lib/ai/scoring.ts` | Truyền `taskType: "scoring"` khi gọi callClaude |
| `lib/ai/learning.ts` | Truyền `taskType: "learning"` (dùng chung model scoring) |
| `lib/brief/generate-morning-brief.ts` | Truyền `taskType: "morning_brief"` |
| `lib/content/generate-brief.ts` | Truyền `taskType: "content_brief"` |
| `lib/reports/generate-weekly-report.ts` | Truyền `taskType: "weekly_report"` |
| `lib/parsers/ai-detect.ts` | Truyền `taskType: "scoring"` (dùng chung) |
| `app/settings/page.tsx` | **MỚI** — Server component, metadata |
| `components/settings/settings-page-client.tsx` | **MỚI** — Client component: fetch models, 4 dropdowns, save |
| `app/api/settings/ai-models/route.ts` | **MỚI** — GET: đọc config từ DB. POST: lưu config |
| `app/api/settings/available-models/route.ts` | **MỚI** — GET: gọi Anthropic API list models, map tên thân thiện |
| `components/layout/sidebar.tsx` | Thêm Settings nav item (icon Settings, href /settings, đặt dưới cùng tách bởi divider) |
| `components/layout/mobile-nav.tsx` | Thêm Settings vào slide-over menu (không thêm vào bottom tabs) |

### Phase 2: Fix ảnh sản phẩm (2 files)

| File | Thay đổi |
|------|----------|
| `components/dashboard/content-suggestions-widget.tsx` | Thay raw `<Image>` (line 76-83) bằng `<ProductImage>` component |
| `components/library/asset-card.tsx` | Thay raw `<Image>` (line 83-90) bằng `<ProductImage>` component |

### Phase 3: Design Overhaul (30+ files)

**3A. Foundation (3 files)**

| File | Thay đổi |
|------|----------|
| `app/layout.tsx` | Thay Geist → Be Vietnam Pro font import |
| `app/globals.css` | Thay toàn bộ `:root` và `.dark` CSS variables: primary → cam Claude, cập nhật accent, sidebar colors |
| `components/ui/button.tsx` | Xác nhận button dùng CSS variables (đã đúng) — không cần sửa, sẽ tự update khi globals.css đổi |

**3B. Navigation (2 files)**

| File | Thay đổi |
|------|----------|
| `components/layout/sidebar.tsx` | Active state: `bg-blue-50 text-blue-600` → `bg-orange-50 text-orange-600` (hoặc dùng CSS var). Thêm Settings item |
| `components/layout/mobile-nav.tsx` | Active state: same blue→orange swap. Bottom tabs active color |

**3C. Components with hardcoded blue (20 files, 113 occurrences)**

Dùng find-replace pattern: `bg-blue-600` → `bg-primary`, `text-blue-600` → `text-primary`. Hoặc trực tiếp `bg-blue-*` → `bg-orange-*`.

**Strategy**: Thay `bg-blue-600 hover:bg-blue-700` → dùng CSS variable `bg-primary hover:bg-primary/90` cho tất cả primary buttons. Cho badges/highlights: `bg-blue-50` → `bg-orange-50`, `text-blue-700` → `text-orange-700`.

Files cần sửa (mỗi file 2-6 occurrences):

| File | Blue occurrences |
|------|-----------------|
| `components/log/log-page-client.tsx` | 4 bg + text |
| `components/production/production-page-client.tsx` | 2 bg + text |
| `components/library/library-page-client.tsx` | 1 bg + text |
| `components/library/asset-card.tsx` | 2 text |
| `components/shops/shop-edit-form.tsx` | 1 bg |
| `components/shops/shop-create-modal.tsx` | 1 bg |
| `components/upload/upload-progress.tsx` | 1 bg |
| `components/upload/column-mapping.tsx` | 1 bg |
| `components/upload/import-detection-card.tsx` | 1 bg |
| `components/products/affiliate-link-section.tsx` | 1 bg + text |
| `components/products/personal-notes-section.tsx` | 1 bg |
| `components/products/score-button.tsx` | 1 bg |
| `components/insights/trigger-learning-button.tsx` | 1 bg |
| `components/insights/insights-page-client.tsx` | 1 bg + text |
| `components/insights/calendar-tab.tsx` | 1 bg + text |
| `components/insights/overview-tab.tsx` | text |
| `components/dashboard/content-suggestions-widget.tsx` | 3 text |
| `components/dashboard/morning-brief-widget.tsx` | text |
| `components/inbox/inbox-table.tsx` | text |
| `components/ai/confidence-widget.tsx` | text |

**Exception**: `bg-purple-*` trong `components/sync/tiktok-studio-dropzone.tsx` và `components/insights/calendar-event-form.tsx` — GIỮ NGUYÊN (purple dùng cho TikTok-specific styling, calendar accent).

**3D. Typography increase (global)**

Approach: KHÔNG sửa từng file. Thay vào đó, override base styles trong `globals.css`:

```css
@layer base {
  body { @apply text-[15px] leading-relaxed; }
}
```

Heading sizes sửa tại từng page component (page title `text-2xl` → `text-[28px]`, section title `text-lg` → `text-[22px]`). Có ~15 page files cần cập nhật headings.

**3E. Table row height**

Files with tables: `components/products/product-table.tsx`, `components/inbox/inbox-table.tsx`, `components/log/log-page-client.tsx`. Tăng `py-3` → `py-3.5` cho table cells.

### Phase 4: Vietnamese Text Fix (1 file)

| File | Thay đổi |
|------|----------|
| `docs/TEST-RESULTS.md` | Update stale test output: "So khoi" → "Sơ khởi", "Dang tao brief" → "Đang tạo brief". Source code đã đúng |

---

## 4. Thứ tự thực hiện

### Phase 1: Settings Page
**Prerequisite:** Prisma migration
1. Add `AiModelConfig` model to schema → `pnpm prisma migrate dev`
2. Create `lib/ai/claude.ts` changes (getModelForTask, callClaude signature)
3. Create API routes (settings/ai-models, settings/available-models)
4. Create settings page + client component
5. Update sidebar + mobile-nav with Settings item
6. Update 6 callClaude callers to pass taskType
7. `pnpm build` verify

### Phase 2: Fix ảnh sản phẩm
1. Update content-suggestions-widget.tsx → use ProductImage
2. Update asset-card.tsx → use ProductImage
3. `pnpm build` verify

### Phase 3: Design Overhaul
**Sub-phases (do in order):**

3A. Font change
1. Install Be Vietnam Pro in layout.tsx (next/font/google)
2. Update globals.css font variable
3. Verify render

3B. Color system
1. Update globals.css `:root` and `.dark` CSS variables (primary → orange)
2. Update sidebar active state colors
3. Update mobile-nav active state colors
4. Bulk replace `bg-blue-*` → `bg-orange-*` across 20 component files
5. Bulk replace `text-blue-*` → `text-orange-*` across 20 component files
6. `pnpm build` verify

3C. Typography & spacing
1. Update globals.css base body text size
2. Update page headings across ~15 files
3. Update table row heights (3 files)
4. `pnpm build` verify

### Phase 4: Vietnamese text
1. Update TEST-RESULTS.md stale output
2. Commit

### Post-completion
1. `pnpm build` — 0 errors
2. Commit + push
3. Verify Vercel deployment
4. Screenshot all pages for comparison

---

## 5. Estimate effort

| Phase | Scope | Estimate |
|-------|-------|----------|
| Phase 1: Settings | 14 files (6 new, 8 modified) + migration | 45 min |
| Phase 2: Fix ảnh | 2 files | 5 min |
| Phase 3A: Font | 2 files | 5 min |
| Phase 3B: Colors | 22 files (~113 replacements) | 30 min |
| Phase 3C: Typography | 18 files | 20 min |
| Phase 4: Vietnamese | 1 file | 2 min |
| Build + deploy + verify | — | 10 min |
| **Total** | **~55 files** | **~2 hours** |

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Prisma migration fails on Supabase | Settings page blocked | Test migration locally first. If fails, use JSON field in existing model instead of new table |
| Font renders dấu tiếng Việt khác expected | Typography ugly | Be Vietnam Pro designed for Vietnamese — low risk. Verify with accented text immediately |
| Color replace breaks subtle UI distinctions | Some badges/states look wrong | Keep purple for TikTok-specific, keep emerald for success, only replace blue→orange for primary actions |
| `callClaude` signature change breaks callers | Build error | All 6 callers identified and listed. Optional param `taskType` defaults to "scoring" — backwards compatible |
| Dark mode orange too bright | Eye strain | Use `#FF8F47` (softer) in dark mode, not raw `#E87B35`. Test on dark background |
| Anthropic API list-models requires specific permissions | Settings page can't fetch models | Fallback: hardcode 3 known models (Opus, Sonnet, Haiku) if API fails |

---

## 7. Phát hiện thêm khi quét codebase

| Issue | Severity | Notes |
|-------|----------|-------|
| `content-suggestions-widget.tsx` dùng raw `<Image>` không có proxy fallback | MEDIUM | Ảnh 500fd.com bị CORS → hiện placeholder. Fix in Phase 2 |
| `asset-card.tsx` dùng raw `<Image>` không có proxy fallback | MEDIUM | Same issue. Fix in Phase 2 |
| Button component (`ui/button.tsx`) dùng CSS variables — sẽ tự update khi globals.css đổi | INFO | Không cần sửa button.tsx riêng |
| `log-page-client.tsx` 475 lines — quá dài | INFO | Modularization task riêng, không trong scope UI overhaul |
| Current AI model hardcoded `claude-haiku-4-5-20251001` | INFO | Phase 1 sẽ fix, defaults to Sonnet for scoring/briefs |
| Mobile bottom tabs chỉ có 5 items, Settings sẽ không thêm vào | INFO | Settings chỉ ở slide-over menu, không bottom tabs |
