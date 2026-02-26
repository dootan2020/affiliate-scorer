Đọc docs/WORKFLOW-REPORT.md section 5. Fix toàn bộ 9 issues.

---

## 5.1 — CRITICAL: confidence-widget.tsx interface mismatch

File: `components/ai/confidence-widget.tsx`

API `lib/ai/confidence.ts` đã refactor, trả về `assetsLogged`, `assetsPublished`, `contentAssets` nhưng widget vẫn expect `campaignsCompleted`.

Fix:
1. Cập nhật interface `ConfidenceMetrics` trong widget: thay `campaignsCompleted` → `assetsLogged`
2. Cập nhật `METRIC_THRESHOLDS`: thay label "Campaigns hoàn thành" → "Videos đã log"
3. Cập nhật render logic: hiển thị `assetsLogged` thay vì `campaignsCompleted`
4. Kiểm tra mọi field khác trong interface có khớp với API response không — fix tất cả mismatch

---

## 5.2 — Xóa orphan file

Xóa: `app/api/morning-brief/brief-campaign-analyzer.ts`

Grep trước: xác nhận không file nào import `analyzeCampaigns` từ file này.

---

## 5.3 — upload/import/history stale fields

File: `app/api/upload/import/history/route.ts` dòng 17-18

Xóa `campaignsCreated` và `campaignsUpdated` khỏi select query. Giữ field trong schema (data cũ).

---

## 5.4 — Xóa dead code: createContentPostSchema

File: `lib/validations/schemas-content.ts` dòng 103-117

Xóa `createContentPostSchema` và `CreateContentPostInput`. Grep trước: xác nhận không file nào import.

---

## 5.5 — Xóa dead code: ImportedCampaign type

File: `lib/parsers/types.ts` dòng 13-21

Xóa interface `ImportedCampaign`. Grep trước: xác nhận không file nào import.

---

## 5.6 — merge-import.ts unused parameter

File: `lib/parsers/merge-import.ts` dòng 17

Xóa parameter `_campaigns: unknown[]` khỏi function signature `mergeImportedData()`. Tìm tất cả callers → xóa argument campaigns đang truyền vào.

---

## 5.7 — Merge split imports

2 files:

**File 1:** `components/insights/calendar-tab.tsx`
```typescript
// Trước: 2 imports riêng
import { Something } from "./calendar-event-form";
import type { SomeType } from "./calendar-event-form";
// Sau: 1 import
import { Something, type SomeType } from "./calendar-event-form";
```

**File 2:** `components/sync/tiktok-studio-dropzone.tsx`
```typescript
// Trước: 2 imports riêng
import { Something } from "@/lib/parsers/detect-tiktok-studio";
import type { SomeType } from "@/lib/parsers/detect-tiktok-studio";
// Sau: 1 import
import { Something, type SomeType } from "@/lib/parsers/detect-tiktok-studio";
```

---

## 5.8 + 5.9 — SKIP

Không fix 5.8 (oversized files) và 5.9 (duplicate scoring logic) trong lần này. Đây là refactor lớn, làm sau khi test xong workflow.

---

## SAU KHI HOÀN THÀNH

1. `pnpm build` — phải pass 0 errors
2. Xóa docs/WORKFLOW-REPORT.md
3. Tạo docs/WORKFLOW-REPORT.md MỚI — quét code thật, 6 sections, chỉ chứa issues còn lại (5.8 oversized files + 5.9 duplicate scoring). Không liệt kê issues đã fix.
4. Ghi kết quả build vào cuối report.
