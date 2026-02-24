# ROADMAP — AI THƯ KÝ AFFILIATE CÁ NHÂN

> Document này mô tả vision dài hạn. ClaudeKit ĐỌC file này khi thiết kế schema Supabase
> để đảm bảo database có khả năng mở rộng. KHÔNG implement ngay — chỉ thiết kế schema đủ chỗ.

---

## VISION

AffiliateScorer sẽ trở thành AI thư ký cá nhân cho affiliate marketer.
Giống Facebook Pixel thu thập mọi data về user behavior → càng nhiều data → AI càng thông minh.

User upload MỌI THỨ liên quan đến affiliate marketing → AI tổng hợp, phân tích, gợi ý.

---

## 13 NGUỒN DATA

| Phase | # | Nguồn data | AI học được gì | Priority |
|---|---|---|---|---|
| **1 (Hiện tại)** | 1 | FastMoss/KaloData | Thị trường đang cần gì | ✅ Đã có |
| **1** | 2 | FB/TikTok Ads export | Budget nào hiệu quả, SP nào bán tốt | ✅ Đang build |
| **1** | 3 | Shopee/TikTok Affiliate | SP nào thật sự ra tiền | ✅ Đang build |
| **2** | 4 | TikTok/FB Analytics | Content nào giữ chân người xem | ⏳ |
| **2** | 5 | Video/post đã tạo | Style content nào convert | ⏳ |
| **2** | 6 | Comments/reactions | Audience quan tâm gì | ⏳ |
| **2** | 7 | Lịch đăng bài | Thời điểm nào tối ưu | ⏳ |
| **3** | 8 | Sao kê commission + chi phí | Lãi/lỗ thật, không ước tính | ⏳ |
| **3** | 9 | Link affiliate tracking | Link nào sống, link nào chết | ⏳ |
| **3** | 10 | Thông tin shop/brand | Shop nào đáng tin, shop nào rủi ro | ⏳ |
| **3** | 11 | Lịch sale/mùa vụ | Khi nào chuẩn bị content trước | ⏳ |
| **4** | 12 | A/B test content | Content pattern nào thắng | ⏳ |
| **4** | 13 | Ghi chú cá nhân | Context mà data không thể hiện | ⏳ |

---

## YÊU CẦU SCHEMA KHI MIGRATE

Khi thiết kế schema PostgreSQL trên Supabase, ĐẢM BẢO:

### 1. Bảng data_imports — GENERIC, không chỉ cho FastMoss

```
data_imports:
  id
  source_type: "fastmoss" | "kalodata" | "fb_ads" | "tiktok_ads" | "shopee_affiliate" | "tiktok_analytics" | "manual" | "commission_statement" | "content_post" | ...
  file_name
  file_url (lưu file gốc trên Supabase Storage)
  records_count
  status: "processing" | "completed" | "failed"
  metadata: JSONB (flexible cho mỗi source type)
  imported_at
  created_at
```

Source type phải extensible — dùng text hoặc enum có thể thêm giá trị sau.

### 2. Bảng products — Đã có, giữ nguyên mở rộng

Thêm fields sau (nullable, không bắt buộc):
```
products:
  ... (fields hiện tại) ...
  personal_notes: TEXT (ghi chú cá nhân - nguồn #13)
  personal_rating: INTEGER (1-5, đánh giá cá nhân)
  affiliate_link: TEXT (link affiliate hiện tại - nguồn #9)
  affiliate_link_status: TEXT ("active" | "expired" | "dead")
  shop_trust_score: INTEGER (tính từ data shop - nguồn #10)
```

### 3. Bảng campaigns — MỚI, cho Phase 2+

```
campaigns:
  id
  product_id (FK → products)
  platform: "tiktok" | "facebook" | "shopee" | "instagram" | ...
  campaign_type: "paid_ads" | "organic" | "livestream"
  content_url: TEXT (link video/post)
  content_type: "video" | "image" | "carousel" | "livestream"
  
  -- Metrics (từ ads export hoặc analytics)
  spend: DECIMAL
  revenue: DECIMAL
  orders: INTEGER
  clicks: INTEGER
  impressions: INTEGER
  roas: DECIMAL
  cpc: DECIMAL
  ctr: DECIMAL
  
  -- Content metadata (Phase 2 - nguồn #5)
  hook_type: TEXT ("price" | "review" | "comparison" | ...)
  video_duration_seconds: INTEGER
  thumbnail_url: TEXT
  caption: TEXT
  hashtags: TEXT[]
  posted_at: TIMESTAMP
  
  -- A/B test (Phase 4 - nguồn #12)
  ab_test_group: TEXT
  ab_test_id: UUID
  
  metadata: JSONB (flexible)
  created_at
```

### 4. Bảng feedback — Đã có, mở rộng

Đảm bảo feedback table link được tới campaigns:
```
feedback:
  ... (fields hiện tại) ...
  campaign_id: UUID (FK → campaigns, nullable)
  data_import_id: UUID (FK → data_imports, nullable)
```

### 5. Bảng shops — MỚI, cho Phase 3

```
shops:
  id
  name: TEXT
  platform: TEXT
  
  -- Trust metrics (nguồn #10)
  commission_reliability: INTEGER (1-5, trả đúng hẹn không)
  support_quality: INTEGER (1-5)
  sample_policy: TEXT ("sends_free" | "paid_sample" | "no_sample")
  commission_cut_history: JSONB (lịch sử cắt commission)
  
  notes: TEXT (ghi chú cá nhân)
  created_at
  updated_at
```

### 6. Bảng financial_records — MỚI, cho Phase 3

```
financial_records:
  id
  type: "commission_received" | "ads_spend" | "other_cost"
  amount: DECIMAL
  currency: TEXT DEFAULT 'VND'
  source: TEXT ("tiktok_shop" | "shopee" | "lazada" | "fb_ads" | ...)
  reference_id: TEXT (mã giao dịch)
  product_id: UUID (FK, nullable)
  campaign_id: UUID (FK, nullable)
  date: DATE
  notes: TEXT
  metadata: JSONB
  created_at
```

### 7. Bảng calendar_events — MỚI, cho Phase 3

```
calendar_events:
  id
  event_type: "mega_sale" | "flash_sale" | "seasonal" | "custom"
  name: TEXT ("9.9 Sale", "Tết 2026", ...)
  start_date: DATE
  end_date: DATE
  prep_start_date: DATE (ngày nên bắt đầu chuẩn bị content)
  platforms: TEXT[] ("tiktok", "shopee", ...)
  notes: TEXT
  recurring: BOOLEAN DEFAULT false
  recurrence_rule: TEXT (yearly, etc.)
  created_at
```

### 8. Bảng ai_learning_logs — Đã có (LearningLog), giữ nguyên

Đảm bảo lưu đủ:
- Weight changes
- Patterns discovered
- Accuracy metrics
- Data points used

---

## NGUYÊN TẮC THIẾT KẾ

1. **JSONB cho metadata** — mọi bảng có cột `metadata JSONB` để lưu data chưa biết trước
2. **Nullable cho fields tương lai** — thêm cột mới nhưng không bắt buộc, không break data cũ
3. **source_type extensible** — dùng TEXT, không dùng ENUM cứng (thêm source mới dễ)
4. **Foreign keys optional** — campaigns → products là nullable vì có thể chưa map được
5. **Timestamps everywhere** — mọi bảng có created_at, updated_at

---

## KHÔNG IMPLEMENT NGAY

Chỉ TẠO BẢNG khi migrate (Phase A trong MIGRATE-SUPABASE-VERCEL.md).
Các bảng Phase 2-4 tạo trống, chưa có UI, chưa có parser.
Mục đích: schema sẵn sàng, không phải alter table sau này.

Bảng TẠO NGAY (có data): products, data_imports, feedback, ai_learning_logs, scores
Bảng TẠO TRỐNG (chưa dùng): campaigns, shops, financial_records, calendar_events
