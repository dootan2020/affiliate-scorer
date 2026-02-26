Sửa 5 lỗi FAIL từ báo cáo kiểm thử (docs/TEST-REPORT.md).

---

## FAIL-01 + FAIL-02: Metadata title thiếu trên /inbox và /sync

### Vấn đề
`/inbox` và `/sync` hiện title mặc định "PASTR — AI Video Affiliate" thay vì "Hộp sản phẩm | PASTR" và "Đồng bộ dữ liệu | PASTR".

Nguyên nhân: page.tsx dùng `"use client"` → không thể export metadata.

### Cách sửa
Tách mỗi page thành 2 phần:
1. `page.tsx` — server component, export metadata, import client component
2. `page-client.tsx` — client component chứa toàn bộ UI + logic

Ví dụ cho /inbox:
```tsx
// app/inbox/page.tsx (server component)
import type { Metadata } from 'next'
import InboxPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Hộp sản phẩm',  // layout.tsx template sẽ thêm "| PASTR"
}

export default function InboxPage() {
  return <InboxPageClient />
}
```

```tsx
// app/inbox/page-client.tsx
"use client"
// ... toàn bộ code cũ của page.tsx
```

Làm tương tự cho /sync (app/upload/page.tsx hoặc app/sync/page.tsx).

---

## FAIL-03: Trang chủ (/) title thiếu "| PASTR"

### Vấn đề
Title hiện: "Tổng quan"
Mong đợi: "Tổng quan | PASTR"

### Cách sửa
Kiểm tra `app/layout.tsx` — metadata template phải có format:
```tsx
export const metadata: Metadata = {
  title: {
    default: 'PASTR — Paste links. Ship videos. Learn fast.',
    template: '%s | PASTR',
  },
}
```

Và trang chủ `app/page.tsx` hoặc `app/(dashboard)/page.tsx` phải export:
```tsx
export const metadata: Metadata = {
  title: 'Tổng quan',  // → render thành "Tổng quan | PASTR"
}
```

Nếu trang chủ cũng là "use client" → áp dụng cách tách page.tsx / page-client.tsx như trên.

---

## FAIL-04: Morning Brief API quá chậm (3.7-4.5 giây)

### Vấn đề
API `/api/morning-brief` gọi AI model (gemini-2.5-pro) realtime mỗi lần → 3.7-4.5s, vượt ngưỡng 2s.

### Cách sửa — Cache theo ngày

```tsx
// Trong API route /api/morning-brief

// 1. Kiểm tra cache trước
const cacheKey = `morning-brief:${userId}:${todayDate}`  // format: 2026-02-27
const cached = await prisma.cache.findUnique({ where: { key: cacheKey } })

if (cached && !forceRefresh) {
  // Cache còn hạn (cùng ngày) → trả về ngay
  return NextResponse.json(JSON.parse(cached.value))
}

// 2. Gọi AI model (chỉ khi chưa có cache hoặc force refresh)
const briefData = await callAI(...)

// 3. Lưu cache
await prisma.cache.upsert({
  where: { key: cacheKey },
  create: { key: cacheKey, value: JSON.stringify(briefData), expiresAt: endOfDay },
  update: { value: JSON.stringify(briefData), expiresAt: endOfDay },
})

return NextResponse.json(briefData)
```

Hoặc đơn giản hơn: dùng biến cache trong memory nếu không muốn thêm bảng DB:
```tsx
// Cache đơn giản bằng Map (reset khi server restart)
const briefCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 15 * 60 * 1000  // 15 phút

// Trong handler:
const cacheKey = `${userId}:${new Date().toDateString()}`
const cached = briefCache.get(cacheKey)

if (cached && Date.now() - cached.timestamp < CACHE_TTL && !forceRefresh) {
  return NextResponse.json(cached.data)
}
```

Logic:
- Lần đầu mở Dashboard trong ngày → gọi AI (3-4s), lưu cache
- Các lần sau → trả cache ngay (< 200ms)
- Nút refresh 🔄 → gọi AI lại (force refresh), cập nhật cache
- Cache hết hạn cuối ngày hoặc sau 15 phút

---

## FAIL-05: Items chưa enrich (title/price/image null)

### Vấn đề
1 item ở state "new" chưa được enrich — thiếu title, price, imageUrl.

### Cách sửa (ưu tiên thấp — chỉ 1/370 items)

Kiểm tra enrich pipeline có chạy tự động sau khi paste link không. Nếu chưa:

```tsx
// Trong API /api/inbox/paste, sau khi tạo product mới:

// Tạo product với state "new"
const product = await prisma.product.create({ data: { ... } })

// Trigger enrich ngay (async, không block response)
// Option A: Gọi enrich API ngay
fetch(`${baseUrl}/api/inbox/enrich`, {
  method: 'POST',
  body: JSON.stringify({ productId: product.id }),
}).catch(console.error)  // fire and forget

// Option B: Hoặc đánh dấu để background job xử lý
// (nếu có cron job enrich)
```

Hoặc đơn giản: hiển thị "Đang xử lý..." cho items state="new" thay vì hiện hàng trống.

---

## YÊU CẦU

- Build 0 lỗi
- Sau khi sửa, chạy lại 5 test FAIL để verify:
  - `curl -s https://affiliate-scorer.vercel.app/inbox | grep "<title>"` → "Hộp sản phẩm | PASTR"
  - `curl -s https://affiliate-scorer.vercel.app/sync | grep "<title>"` → "Đồng bộ dữ liệu | PASTR"
  - `curl -s https://affiliate-scorer.vercel.app/ | grep "<title>"` → "Tổng quan | PASTR"
  - Test Morning Brief API response time sau khi có cache
- Cập nhật docs/TEST-REPORT.md: đánh dấu 5 FAIL đã sửa, ghi commit hash
- Commit: "fix: 5 test failures — metadata titles, morning brief cache, enrich pipeline"
