# MIGRATE TO SUPABASE + DEPLOY VERCEL + GỘP NAV

> 3 việc trong 1 instruction. Thực hiện theo thứ tự.

---

## PHẦN A: MIGRATE SQLITE → SUPABASE (PostgreSQL)

### A0. Đọc ROADMAP trước

Đọc file `ROADMAP-AI-SECRETARY.md` trong project root TRƯỚC KHI thiết kế schema.
File này mô tả 13 nguồn data tương lai. Schema PostgreSQL phải thiết kế extensible theo hướng dẫn trong đó.
Tạo sẵn các bảng trống cho Phase 2-4 (campaigns, shops, financial_records, calendar_events).

### A1. Scout database hiện tại

Trước khi làm gì, kiểm tra:
- Project dùng ORM gì? (Prisma, Drizzle, better-sqlite3, hoặc gì khác)
- Schema có bao nhiêu table, quan hệ gì
- Data hiện có: bao nhiêu records mỗi table
- File .env hiện tại có biến nào liên quan database

Ghi lại kết quả trước khi tiếp tục.

### A2. Setup Supabase

User đã có tài khoản Supabase. Cần user cung cấp:
- Supabase Project URL
- Supabase Anon Key
- Database connection string (Settings → Database → Connection string → URI)

**HỎI USER cung cấp 3 giá trị này trước khi tiếp tục.**

### A3. Chuyển schema sang PostgreSQL

Dựa trên ORM hiện tại:

**Nếu Prisma:**
- Đổi `provider = "sqlite"` → `provider = "postgresql"` trong `prisma/schema.prisma`
- Đổi `datasource db { url = "file:./dev.db" }` → `url = env("DATABASE_URL")`
- Fix incompatible types: SQLite không phân biệt Int/BigInt, PostgreSQL có
- `npx prisma migrate dev --name migrate-to-postgres`

**Nếu Drizzle:**
- Đổi driver từ `better-sqlite3` sang `postgres` hoặc `@supabase/supabase-js`
- Update schema definitions cho PostgreSQL syntax
- Run migration

**Nếu raw SQL / better-sqlite3:**
- Tạo Prisma từ đầu dựa trên schema SQLite hiện tại
- Hoặc dùng Supabase client (`@supabase/supabase-js`) thay thế toàn bộ

**Nếu ORM khác:** Adapt tương tự.

### A4. Migrate data (297 SP + scores)

QUAN TRỌNG: User muốn giữ data hiện tại.

1. Export toàn bộ data từ SQLite ra JSON (viết script)
2. Tạo tables trên Supabase (migration)
3. Import JSON vào Supabase (viết script)
4. Verify: count records mỗi table phải khớp

```
Viết script: scripts/migrate-data.ts
- Đọc từ SQLite file hiện tại
- Insert vào Supabase qua API hoặc connection string
- Log kết quả: "Products: 297/297 ✅, Scores: X/X ✅, ..."
```

### A5. Update toàn bộ database calls

Tìm và sửa TẤT CẢ file gọi database:
- Thay SQLite client → Supabase client hoặc Prisma PostgreSQL
- Đảm bảo KHÔNG còn import nào liên quan sqlite
- Test: mọi page load đúng, không 500 error

### A6. Environment variables

```env
# .env.local
DATABASE_URL=postgresql://...  # Supabase connection string
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Xóa biến SQLite cũ nếu có.

---

## PHẦN B: DEPLOY LÊN VERCEL

### B1. Chuẩn bị project cho deploy

1. Đảm bảo `next.config.js` không có gì blocking production build
2. Kiểm tra `package.json` → `build` script chạy OK: `pnpm build` không lỗi
3. File `.env.local` KHÔNG commit lên git (check `.gitignore`)
4. Nếu dùng Prisma: thêm `postinstall` script: `"postinstall": "prisma generate"`

### B2. Push code lên GitHub

```bash
git add .
git commit -m "feat: migrate to supabase + postgresql"
git push origin main
```

Nếu chưa có repo GitHub → tạo repo mới, push lên.

### B3. Connect Vercel

User đã có tài khoản Vercel. Hướng dẫn user:
1. Vercel Dashboard → New Project → Import từ GitHub repo
2. Framework: Next.js (auto-detect)
3. Environment Variables → thêm tất cả biến từ .env.local:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Các biến khác nếu có (API keys, etc.)
4. Deploy

### B4. Verify sau deploy

- [ ] URL Vercel truy cập được (không 500)
- [ ] Dashboard hiện Top 10 (data migrate thành công)
- [ ] Click SP → trang chi tiết load đúng
- [ ] Upload file FastMoss mới → hoạt động
- [ ] Tất cả trang hoạt động bình thường

---

## PHẦN C: GỘP NAVIGATION (4 TAB)

### C1. Cấu trúc mới

Hiện tại 5 tab: Dashboard | Sản phẩm | Upload | Insights | Kết quả

**Đổi thành 4 tab:**

| Tab | Route | Chức năng |
|---|---|---|
| Dashboard | / | Top 10 + tổng quan + quick upload |
| Sản phẩm | /products | Danh sách tất cả SP + filter + detail |
| Upload | /upload | 3 zone (xem bên dưới) |
| Insights | /insights | Lịch sử feedback + Learning + AI insights |

**XÓA tab "Kết quả"** (/feedback) khỏi nav.

### C2. Trang /upload — Gộp thành 3 zone

```
Upload Data
Upload tất cả dữ liệu để AI ngày càng thông minh hơn

┌─────────────────────────────────────────────────┐
│ 🔍 Nghiên cứu sản phẩm                         │
│ Upload file từ FastMoss, KaloData               │
│ [Kéo thả file vào đây]                         │
│ Hỗ trợ .csv, .xlsx, .xls                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📊 Kết quả chiến dịch                          │
│ Upload kết quả từ FB Ads, TikTok Ads,          │
│ Shopee Affiliate — AI sẽ học từ data này        │
│ [Kéo thả file vào đây]                         │
│ FB Ads, TikTok Ads, Shopee (.csv, .xlsx)        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✏️ Nhập kết quả thủ công                        │
│ Cho kết quả organic hoặc khi không có file      │
│ [Nhập kết quả thủ công →]                       │
└─────────────────────────────────────────────────┘

Lịch sử upload (X bản ghi)
[Bảng lịch sử các lần upload]
```

### C3. Trang /insights — Gộp feedback + learning

```
AI Insights
Phân tích từ [X] feedback thực tế

┌──────────────┬──────────────┬──────────────┐
│ Feedback     │ Độ tin cậy   │ Lần học gần  │
│ 0            │ RẤT THẤP     │ nhất: —      │
│ bản ghi      │ 0/20 SP      │              │
└──────────────┴──────────────┴──────────────┘

[Chạy Learning]  ← nút chỉ active khi ≥5 feedback

── Lịch sử Feedback ──
[Bảng: ngày, nguồn, SP, ROAS, đánh giá]
(Di chuyển từ /feedback sang đây)

── Kết quả Learning ──
(Khi có data: weight changes, accuracy trend, patterns phát hiện)

── Chưa có dữ liệu ──
Upload kết quả chiến dịch tại trang Upload để AI bắt đầu học.
[Đi tới Upload →]
```

### C4. Cleanup

- Xóa route /feedback (hoặc redirect /feedback → /insights)
- Xóa component page feedback nếu không dùng nữa
- Update mọi link internal trỏ tới /feedback → /insights hoặc /upload
- Kiểm tra không còn dead link nào

---

## THỨ TỰ THỰC HIỆN

```
── PHẦN A: DATABASE ──
1. Scout ORM + schema hiện tại
2. HỎI USER: Supabase URL, Anon Key, Database URL
3. Chuyển schema → PostgreSQL
4. Viết script migrate data
5. Chạy migrate + verify count
6. Update tất cả database calls
7. Test local: pnpm dev → mọi trang hoạt động

── PHẦN B: DEPLOY ──
8. Build test: pnpm build (không lỗi)
9. Push lên GitHub
10. HƯỚNG DẪN USER: connect Vercel + thêm env vars
11. Deploy + verify URL live

── PHẦN C: NAV ──
12. Đổi nav 5 tab → 4 tab
13. Gộp /upload (3 zone)
14. Gộp /insights (feedback + learning)
15. Xóa/redirect /feedback
16. Test tất cả navigation
```

## LƯU Ý QUAN TRỌNG

- Bước 2 + 10: PHẢI HỎI USER input (credentials, Vercel setup) — không tự tạo
- Bước 4: PHẢI verify data count khớp trước khi xóa SQLite
- Backup file SQLite (.db) trước khi bắt đầu — đề phòng rollback
- Sau khi Vercel deploy thành công, test lại TẤT CẢ: Dashboard, SP list, SP detail, Upload, Insights

## TEST CUỐI CÙNG

- [ ] Vercel URL truy cập được 24/7
- [ ] Dashboard hiện Top 10 với 297 SP
- [ ] Upload FastMoss mới → data lưu vào Supabase
- [ ] Trang chi tiết SP đầy đủ (radar chart, gợi ý, ước tính)
- [ ] Nav chỉ có 4 tab: Dashboard, Sản phẩm, Upload, Insights
- [ ] Không còn route /feedback (redirect về /insights)
- [ ] Nhập kết quả thủ công nằm trong /upload
- [ ] Lịch sử feedback nằm trong /insights
- [ ] pnpm build không lỗi
- [ ] Không còn import/reference nào tới SQLite
