Đọc docs/WORKFLOW-REPORT.md để hiểu context. Dưới đây là 3 nhóm fix, làm theo thứ tự.

---

## NHÓM 1: FIX DUAL IDENTITY SYSTEM (HIGH PRIORITY)

Vấn đề: Product và ProductIdentity chạy song song nhưng không đồng bộ. Upload FastMoss → Product có aiScore, nhưng ProductIdentity.combinedScore không tự update. `/inbox/[id]` nhận cả 2 loại ID gây confusion.

### 1A. Auto-sync score khi upload FastMoss

File: `app/api/upload/products/route.ts` (hoặc nơi xử lý sau khi upload xong + score xong)

Sau khi `scoreProducts()` chạy xong và Product có `aiScore`, phải TỰ ĐỘNG gọi logic tương tự `/api/inbox/score-all` để:
- Tìm ProductIdentity linked với Product vừa scored
- Cập nhật `ProductIdentity.combinedScore` = tính từ Product.aiScore (market) + contentPotentialScore (content)
- Cập nhật `ProductIdentity.inboxState` = "scored" nếu đang ở "new" hoặc "enriched"

Cách làm: Extract logic score từ `/api/inbox/score-all` thành shared function (VD: `lib/services/score-identity.ts`), rồi gọi function đó ở cả 2 nơi:
- Sau upload FastMoss (auto)
- Khi user bấm score thủ công từ inbox

### 1B. Fix `/inbox/[id]` — chỉ nhận ProductIdentity.id

File: `app/inbox/[id]/page.tsx`

Hiện tại có fallback: nếu không tìm thấy ProductIdentity → dùng id như Product.id. XÓA fallback này.

Logic mới:
1. Lookup ProductIdentity by id (include Product relation)
2. Nếu KHÔNG tìm thấy → check xem id có phải Product.id không → nếu đúng → tìm ProductIdentity linked với Product đó → redirect sang `/inbox/[identity.id]`
3. Nếu vẫn không tìm thấy → 404

Mục đích: URL luôn là `/inbox/[ProductIdentity.id]`, không bao giờ là `/inbox/[Product.id]`.

### 1C. Fix similar products link trong `/inbox/[id]`

File: `app/inbox/[id]/page.tsx` dòng ~414

Hiện tại: `<Link href={/inbox/${sp.id}}>` với `sp.id` là Product.id

Sửa: Khi query similar products, JOIN với ProductIdentity để lấy identity.id. Link phải là `/inbox/[identity.id]`. Nếu Product không có linked ProductIdentity → không hiện trong danh sách similar (hoặc tạo identity on-the-fly).

### 1D. Đảm bảo mọi nơi reference Product đều đi qua ProductIdentity

Quét toàn bộ codebase, tìm mọi chỗ dùng `Product.id` để tạo link `/inbox/...` hoặc `/products/...`. Tất cả phải chuyển sang dùng `ProductIdentity.id`. Danh sách cần check:
- Dashboard Morning Brief widget
- Dashboard Content Suggestions widget
- Production page (chọn SP)
- Log page (match video → product)
- Library page (hiện product info)
- Insights page

---

## NHÓM 2: FIX HARDCODED LINKS (MEDIUM)

3 file cần sửa, đơn giản find & replace:

| File | Sai | Đúng |
|------|-----|------|
| `components/insights/insights-page-client.tsx` ~dòng 157 | `href="/upload"` | `href="/sync"` |
| `components/insights/overview-tab.tsx` ~dòng 230 | `href="/products"` | `href="/inbox"` |
| `app/shops/page.tsx` ~dòng 180 | `href="/products"` | `href="/inbox"` |

Sau khi sửa, quét thêm toàn bộ codebase tìm các string `/upload"`, `/products"`, `/feedback"`, `/campaigns"`, `/playbook"` trong JSX/TSX. Nếu còn hardcoded link cũ nào → sửa luôn (trừ trong API routes và redirects — những cái đó đúng rồi).

---

## NHÓM 3: DỌN DEAD CODE (LOW nhưng nên làm)

### 3A. Morning Brief — bỏ Campaign query

File: `app/api/morning-brief/route.ts` dòng 30-47

Xóa đoạn query `prisma.campaign.findMany({ where: { status: "running" } })`. Thay bằng:
- Query ProductIdentity có `inboxState = "scored"` và `combinedScore` cao nhất, chưa brief
- Đây mới là data đúng cho Content Factory workflow

Cập nhật response format tương ứng. Morning Brief nên trả về:
- Top 5 SP nên tạo content hôm nay (sort by combinedScore, filter chưa brief)
- Upcoming events (giữ nguyên CalendarEvent query)
- Account stats tóm tắt (từ AccountDailyStat nếu có)
- Bỏ phần "active campaigns"

### 3B. Xóa orphan APIs

Xóa hoàn toàn các file:
- `app/api/feedback/manual/route.ts`
- `app/api/upload/feedback/route.ts`
- `app/api/inbox/migrate/route.ts`
- `app/api/ai/patterns/route.ts` (dùng WinPattern cũ — đã có `/api/patterns` dùng UserPattern mới)

### 3C. Xóa model WinPattern references

Quét codebase tìm mọi import/reference đến `WinPattern`. Nếu có component nào dùng `/api/ai/patterns` → chuyển sang dùng `/api/patterns` (UserPattern). Sau khi không còn reference → có thể comment model WinPattern trong schema (KHÔNG xóa model khỏi schema vì có data cũ, chỉ đảm bảo code không dùng nữa).

### 3D. Cleanup UserGoal

Quét xem UI đang dùng `UserGoal` hay `GoalP5`. Nếu UI chỉ dùng GoalP5 → xóa:
- `app/api/goals/route.ts` (API cũ)
- Mọi reference đến UserGoal trong components

Nếu UI đang dùng cả 2 → consolidate về GoalP5.

### 3E. Cleanup DataImport stale fields

File: component hiện import history trong `/sync`

Tìm chỗ hiển thị `campaignsCreated` và `campaignsUpdated` → xóa khỏi UI. Không cần sửa DB schema (để yên field trong Prisma model, chỉ bỏ khỏi hiển thị).

### 3F. Xóa `/api/upload/feedback/route.ts` nếu chưa xóa ở 3B

Double check.

---

## SAU KHI HOÀN THÀNH

Cập nhật file `docs/WORKFLOW-REPORT.md`:
- Section 5 "Vấn đề Phát Hiện": đánh dấu các issue đã fix, ghi ngày fix
- Nếu phát hiện issue mới trong quá trình fix → thêm vào report
- Update section 4 "API Endpoints": xóa các endpoint đã remove khỏi danh sách

Chạy build (`npm run build` hoặc `pnpm build`) để đảm bảo không có lỗi TypeScript sau khi cleanup.
