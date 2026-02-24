# PHASE 2: PERSONAL LAYER

> Tham chiếu: ROADMAP-FINAL.md
> Goal: User đánh dấu, ghi chú, lên kế hoạch — dùng ngay không cần data ngoài.
> Schema cho shops, financial_records, calendar_events ĐÃ CÓ trong DB.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — thêm fields mới cho Product
2. API routes — /api/products/[id]/notes, /api/shops, /api/financial, /api/calendar
3. Seed calendar events (lịch sale 2026)
4. Trang chi tiết SP — thêm "Ghi chú của tôi" + "Link Affiliate"
5. Trang /shops + /shops/[id]
6. Trang /insights redesign (5 tabs)
7. Dashboard — widget "Sự kiện sắp tới"
8. Test toàn bộ
```

---

## 1. GHI CHÚ CÁ NHÂN CHO SẢN PHẨM

### Trang chi tiết SP — thêm section "Ghi chú của tôi"

Đặt TRƯỚC section "Thông tin sản phẩm", SAU section "Chiến lược nền tảng".

```
┌─────────────────────────────────────────────────┐
│ 📝 Ghi chú của tôi                              │
│                                                  │
│ [Textarea — placeholder: "VD: Ship chậm 5 ngày, │
│  khách hay hỏi về size, shop trả lời nhanh..."] │
│                                                  │
│ Đánh giá cá nhân: ⭐⭐⭐⭐⭐ (1-5 sao, click)     │
│                                                  │
│ Tags: [Đã thử] [Ship nhanh] [Chất lượng tốt]   │
│       [+ Thêm tag]                               │
│                                                  │
│ [Lưu]                          Cập nhật: 24/2    │
└─────────────────────────────────────────────────┘
```

### Schema migration — thêm fields vào Product:

```
personalNotes: TEXT (nullable)
personalRating: INTEGER 1-5 (nullable)
personalTags: JSONB — string array (nullable)
affiliateLink: TEXT (nullable)
affiliateLinkStatus: TEXT — "active" | "expired" | "dead" (nullable)
affiliateLinkCreatedAt: TIMESTAMP (nullable)
```

### Logic:
- Auto-save khi blur textarea hoặc click sao
- Hiện timestamp lần cập nhật gần nhất

### API:
```
PATCH /api/products/[id]/notes
Body: { notes: string, rating: number, tags: string[] }
```

---

## 2. QUẢN LÝ SHOP/BRAND

### 2A. Trang chi tiết SP — shop name thành clickable → /shops/[id]

Nếu shop chưa tồn tại trong bảng Shop → tự tạo khi user click "Đánh giá shop".

### 2B. Trang /shops (KHÔNG thêm vào nav — truy cập qua SP detail hoặc URL)

```
Danh sách Shop — [X] shop đã đánh giá

┌────────────────────────────────────────────────────────────────┐
│ Tên shop     │ SP │ Tin cậy │ Hỗ trợ │ Sample │ Ghi chú      │
├──────────────┼────┼─────────┼────────┼────────┼──────────────┤
│ LUOBR.VN     │ 5  │ ⭐⭐⭐⭐  │ ⭐⭐⭐   │ Gửi free│ Trả lời <1h │
│ LC Jewelry   │ 3  │ ⭐⭐⭐   │ ⭐⭐    │ Không  │ Hay cắt HH  │
└────────────────────────────────────────────────────────────────┘
```

### 2C. Trang /shops/[id] — Chi tiết shop

```
┌─────────────────────────────────────────────────┐
│ LUOBR.VN — TikTok Shop                         │
│                                                  │
│ Trả commission đúng hẹn: ⭐⭐⭐⭐⭐ (1-5)          │
│ Hỗ trợ affiliate:        ⭐⭐⭐⭐  (1-5)          │
│ Sample policy: [Gửi free ▼]                     │
│                                                  │
│ Ghi chú: [Textarea]                             │
│ Lịch sử commission: [+ Thêm sự kiện]           │
│                                                  │
│ Sản phẩm từ shop này: (5 SP)                    │
│ [Danh sách SP link về detail]                    │
└─────────────────────────────────────────────────┘
```

### Schema — kiểm tra bảng Shop đã có, thêm nếu thiếu:
- name, platform
- commissionReliability: INT 1-5
- supportQuality: INT 1-5
- samplePolicy: TEXT — "sends_free" | "paid_sample" | "no_sample" | null
- commissionCutHistory: JSONB
- notes: TEXT

Thêm relation: Product.shopName match → Shop, hoặc thêm shopId FK.

### API:
```
GET    /api/shops              — Danh sách
GET    /api/shops/[id]         — Chi tiết
POST   /api/shops              — Tạo mới
PATCH  /api/shops/[id]         — Cập nhật
```

---

## 3. THEO DÕI THU CHI

### Gộp vào Insights — tab "Thu chi"

```
┌─────────────────────────────────────────────────┐
│ 💰 Tổng quan thu chi — Tháng 2/2026            │
│                                                  │
│ ┌──────────┬──────────┬──────────┐              │
│ │ Thu      │ Chi      │ Lãi/Lỗ   │              │
│ │ 0₫      │ 0₫       │ 0₫       │              │
│ └──────────┴──────────┴──────────┘              │
│                                                  │
│ [+ Thêm thu] [+ Thêm chi]                      │
│                                                  │
│ Lịch sử giao dịch:                              │
│ ┌──────┬──────┬────────┬─────────┬─────────────┐│
│ │ Ngày │ Loại │ Số tiền│ Nguồn   │ Ghi chú     ││
│ └──────┴──────┴────────┴─────────┴─────────────┘│
└─────────────────────────────────────────────────┘
```

### Form modal "Thêm thu/chi":

```
Loại: [Commission ▼] / [Ads spend ▼] / [Khác]
Số tiền: [___________] VND
Nguồn: [TikTok Shop ▼] [Shopee ▼] [FB Ads ▼]
Sản phẩm (tuỳ chọn): [Search SP ▼]
Ngày: [__/__/____]
Ghi chú: [___________]
```

### Logic:
- type: "commission_received" | "ads_spend" | "other_cost" | "other_income"
- amount: số dương, type quyết định thu/chi
- source: "tiktok_shop" | "shopee" | "lazada" | "fb_ads" | "tiktok_ads" | "other"
- productId: FK optional
- date: ngày giao dịch

### API:
```
GET    /api/financial          — Danh sách + summary
POST   /api/financial          — Thêm
PATCH  /api/financial/[id]     — Sửa
DELETE /api/financial/[id]     — Xoá
GET    /api/financial/summary  — Tổng theo tháng
```

---

## 4. LỊCH SALE / MÙA VỤ

### Dashboard widget "Sắp tới" — đặt TRÊN bảng Top 10:

```
┌─────────────────────────────────────────────────┐
│ 📅 Sắp tới                                      │
│                                                  │
│ 🔴 3.3 Sale (1/3 - 3/3) — còn 5 ngày           │
│    Nên chuẩn bị content từ BÂY GIỜ              │
│                                                  │
│ 🟡 8/3 Quốc tế Phụ nữ — còn 12 ngày            │
│    SP phù hợp: Phụ kiện, Mỹ phẩm, Quà tặng    │
│                                                  │
│ [Xem tất cả] [+ Thêm sự kiện]                  │
└─────────────────────────────────────────────────┘
```

### Insights → tab "Lịch sự kiện":

Danh sách events theo tháng. Form thêm/sửa/xoá.

### SEED DATA — 18 events 2026:

```javascript
const SEED_EVENTS = [
  { name: "Valentine", type: "seasonal", start: "2026-02-14", end: "2026-02-14", recurring: true },
  { name: "3.3 Mega Sale", type: "mega_sale", start: "2026-03-01", end: "2026-03-03", recurring: true },
  { name: "Quốc tế Phụ nữ", type: "seasonal", start: "2026-03-08", end: "2026-03-08", recurring: true },
  { name: "4.4 Sale", type: "mega_sale", start: "2026-04-04", end: "2026-04-04", recurring: true },
  { name: "30/4 - 1/5", type: "seasonal", start: "2026-04-30", end: "2026-05-01", recurring: true },
  { name: "5.5 Sale", type: "mega_sale", start: "2026-05-05", end: "2026-05-05", recurring: true },
  { name: "6.6 Sale", type: "mega_sale", start: "2026-06-06", end: "2026-06-06", recurring: true },
  { name: "7.7 Sale", type: "mega_sale", start: "2026-07-07", end: "2026-07-07", recurring: true },
  { name: "8.8 Sale", type: "mega_sale", start: "2026-08-08", end: "2026-08-08", recurring: true },
  { name: "Back to School", type: "seasonal", start: "2026-08-15", end: "2026-09-05", recurring: true },
  { name: "9.9 Sale", type: "mega_sale", start: "2026-09-09", end: "2026-09-09", recurring: true },
  { name: "Trung thu", type: "seasonal", start: "2026-09-27", end: "2026-09-27", recurring: true },
  { name: "10.10 Sale", type: "mega_sale", start: "2026-10-10", end: "2026-10-10", recurring: true },
  { name: "Singles Day 11.11", type: "mega_sale", start: "2026-11-11", end: "2026-11-11", recurring: true },
  { name: "Black Friday", type: "mega_sale", start: "2026-11-27", end: "2026-11-27", recurring: true },
  { name: "12.12 Sale", type: "mega_sale", start: "2026-12-12", end: "2026-12-12", recurring: true },
  { name: "Giáng sinh", type: "seasonal", start: "2026-12-25", end: "2026-12-25", recurring: true },
  { name: "Tết Nguyên Đán", type: "seasonal", start: "2027-02-06", end: "2027-02-12", recurring: true },
];
```

### API:
```
GET    /api/calendar            — Danh sách
POST   /api/calendar            — Thêm
PATCH  /api/calendar/[id]       — Sửa
DELETE /api/calendar/[id]       — Xoá
GET    /api/calendar/upcoming   — Sắp tới (cho Dashboard)
```

---

## 5. LINK AFFILIATE

### Trang chi tiết SP — section "Link Affiliate":

```
┌─────────────────────────────────────────────────┐
│ 🔗 Link Affiliate của tôi                       │
│                                                  │
│ Link: [https://...]                              │
│ Trạng thái: 🟢 Active    Tạo: 15/2/2026        │
│ [Cập nhật link] [Kiểm tra link]                 │
└─────────────────────────────────────────────────┘
```

- Kiểm tra link = HEAD request → check status
- Trang /products thêm filter "Có/Chưa có link affiliate"

---

## 6. INSIGHTS REDESIGN

```
AI Insights
[Tổng quan] [Thu chi] [Lịch sự kiện] [Feedback] [Learning]
```

### Tab Tổng quan:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Sản phẩm     │ Shop đánh giá│ Thu tháng    │ Chi tháng    │
│ 367          │ 0            │ 0₫           │ 0₫           │
│ ghi chú: 0  │              │              │ Lãi: 0₫      │
└──────────────┴──────────────┴──────────────┴──────────────┘

📅 Sự kiện sắp tới
📊 Dữ liệu AI: Feedback 0 | Confidence: Rất thấp

💡 Gợi ý:
• Thêm ghi chú cho Top 10 SP
• Thêm link affiliate cho SP muốn promote
• Upload kết quả chiến dịch đầu tiên
```

### Tab Feedback — giữ nguyên
### Tab Learning — giữ nguyên
### Tab Thu chi — section 3
### Tab Lịch sự kiện — section 4

---

## TEST CHECKLIST

- [ ] Ghi chú + rating + tags lưu đúng trên detail page
- [ ] Link affiliate lưu + kiểm tra được
- [ ] /shops danh sách hiện đúng
- [ ] /shops/[id] đánh giá lưu đúng
- [ ] Insights → Thu chi: CRUD giao dịch
- [ ] Insights → Lịch: 18 events seed, CRUD
- [ ] Dashboard: widget "Sắp tới"
- [ ] Insights → Tổng quan: stats đúng
- [ ] Build pass, không lỗi
