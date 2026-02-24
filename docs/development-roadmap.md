# Development Roadmap — AffiliateScorer

> Living document. Cập nhật khi có thay đổi phase/milestone.
> Ngày cập nhật: 2026-02-24

---

## North Star

**App biết MỌI THỨ về business affiliate của user -> đề xuất HÀNH ĐỘNG cụ thể mỗi ngày.**

Không phải dashboard biểu đồ. Output là: "hôm nay làm gì, theo thứ tự nào".
Đo thành công bằng: số tiền lãi ròng/tháng mà user kiếm được nhờ gợi ý từ AI.

Càng nhiều data upload -> AI càng thông minh -> gợi ý càng chính xác.

---

## Project Status

| Phase | Tên | Status | Progress |
|-------|-----|--------|----------|
| 1 | Foundation | Done | 100% |
| 2 | Personal Layer | Planned | 0% |
| 3A | Campaign Tracker + Morning Brief | Planned | 0% |
| 3B | Data Parsers | Planned | 0% |
| 4 | AI Intelligence | Planned | 0% |

**Tech stack:** Next.js 16, TypeScript, Tailwind CSS, Prisma 7, Supabase PostgreSQL, Claude Haiku 4.5

---

## Phase 1: Foundation

### Status: Done

### Milestones delivered

- [x] FastMoss XLSX upload + auto-score 367 products
- [x] Product detail page (radar chart, AI suggestions, profit estimator, similar products)
- [x] Dashboard Top 10 with dedup logic
- [x] Historical tracking via ProductSnapshot
- [x] Supabase PostgreSQL migration (from SQLite)
- [x] AI Scoring engine (Claude Haiku 4.5)
- [x] Feedback upload system (FB Ads, TikTok Ads, Shopee)
- [x] Learning engine with weekly pattern analysis
- [x] Insights page with accuracy tracking

### Kết quả

Nền tảng hoàn chỉnh: upload data -> AI score -> dashboard -> insights. Sẵn sàng cho personal layer.

---

## Phase 2: Personal Layer

### Status: Planned

### Objectives

Biến app từ "tool chấm điểm chung" thành "trợ lý cá nhân": ghi chú riêng, đánh giá shop, link affiliate, lịch sale, thu chi.

### Implementation Steps

- [ ] 1. Schema migration -- thêm fields Product (`personalNotes`, `personalRating`, `personalTags`, `affiliateLink`, `affiliateLinkStatus`)
- [ ] 2. API routes: `/api/products/[id]/notes`, `/api/shops`, `/api/financial`, `/api/calendar`
- [ ] 3. Seed calendar events (18 events lịch sale 2026)
- [ ] 4. Product detail -- thêm section "Ghi chú của tôi" + "Link Affiliate"
- [ ] 5. `/shops` + `/shops/[id]` pages (đánh giá shop, lịch sử làm việc)
- [ ] 6. Insights redesign (5 tabs: Tổng quan, Thu chi, Lịch sự kiện, Feedback, Learning)
- [ ] 7. Dashboard widget "Sự kiện sắp tới"
- [ ] 8. Test + verify

### Dependencies

- Phase 1 complete (done)

### Success Criteria

- User lưu ghi chú, rating, tags cho bất kỳ SP nào
- Link affiliate trackable (active/expired)
- Lịch sale hiển thị chính xác 18 events 2026
- Thu chi nhập/xem được theo tuần/tháng
- Insights page 5 tabs hoạt động

---

## Phase 3A: Campaign Tracker + Morning Brief

### Status: Planned

### Objectives

Theo dõi lifecycle campaign: từ chọn SP -> chạy ads -> nhập kết quả hàng ngày -> verdict win/loss. Morning Brief gợi ý hành động mỗi ngày.

### Implementation Steps

- [ ] 1. Schema -- tables `Campaign`, `ContentPost`, `UserGoal`
- [ ] 2. API routes: `/api/campaigns` CRUD + `/api/campaigns/[id]/daily-results`
- [ ] 3. Button "Chạy SP này" trên product detail
- [ ] 4. `/campaigns` page (list with filter/sort)
- [ ] 5. `/campaigns/[id]` page (detail + daily input + checklist + content + verdict)
- [ ] 6. Morning Brief widget trên Dashboard
- [ ] 7. Goal setting (monthly profit target)
- [ ] 8. Campaigns tab trong Insights
- [ ] 9. Nav update -- thêm "Campaigns"
- [ ] 10. Test + verify

### Dependencies

- Phase 2 complete (Personal Layer cung cấp ghi chú + calendar data cho Morning Brief)

### Success Criteria

- Tạo campaign từ SP, nhập kết quả daily (spend, revenue, orders) trong 30 giây
- Morning Brief hiển thị 5 mục hành động ưu tiên
- Goal tracking theo tháng (target vs actual)
- Campaign verdict tự động: win/loss/break-even

---

## Phase 3B: Data Parsers

### Status: Planned

### Objectives

Unified upload: kéo thả file bất kỳ -> auto-detect loại -> parse -> merge vào campaign tương ứng. Hỗ trợ FB Ads, TikTok Ads, Shopee Ads, affiliate reports, KaloData.

### Implementation Steps

- [ ] 1. Schema -- table `DataImport` (log mỗi upload: type, rows, status, errors)
- [ ] 2. Upload page redesign -- unified dropzone, auto-detect, upload history
- [ ] 3. Auto-detect engine -- nhận diện file type từ headers/columns
- [ ] 4. Parser: Facebook Ads CSV
- [ ] 5. Parser: TikTok Ads CSV
- [ ] 6. Parser: Shopee Ads CSV
- [ ] 7. Parser: TikTok Affiliate report
- [ ] 8. Parser: Shopee Affiliate report
- [ ] 9. Parser: KaloData CSV
- [ ] 10. Generic CSV parser (manual column mapping cho file chưa hỗ trợ)
- [ ] 11. Merge logic -- match imported data -> existing campaigns
- [ ] 12. YouTube Ads + Google Ads parsers (thêm khi user cần)
- [ ] 13. Test + verify

### Dependencies

- Phase 3A complete (parsers feed data INTO campaigns)

### Success Criteria

- Upload file -> auto-detect type chính xác >= 90%
- Parse FB/TikTok/Shopee Ads without manual mapping
- Data merge vào đúng campaign dựa trên product + date matching
- Upload history hiển thị mọi lần import (rows, errors, status)

---

## Phase 4: AI Intelligence

### Status: Planned

### Objectives

AI thực sự cá nhân hóa: Win Probability Score thay thế AI Score đơn giản, lifecycle tracking, win/loss analysis, pattern library, budget optimization, anomaly detection, Morning Brief V2.

### Implementation Steps

- [ ] 1. Confidence Level system (0-4, đo lượng data user đã cung cấp)
- [ ] 2. Win Probability Score = f(Market 40%, Personal Fit 30%, Timing 15%, Risk 15%)
- [ ] 3. Product Lifecycle tracking (rising -> hot -> peak -> declining)
- [ ] 4. Win/Loss Analysis (tự động khi campaign kết thúc)
- [ ] 5. Pattern Library / Playbook (các pattern thắng/thua cá nhân)
- [ ] 6. Channel + Content recommendation
- [ ] 7. Budget Portfolio allocation
- [ ] 8. Competitive Intelligence (KOL tracker, market trends)
- [ ] 9. Anomaly Detection + Alerts (sales tụt, ROAS giảm, KOL spike)
- [ ] 10. Morning Brief V2 (5 câu hỏi mỗi ngày)
- [ ] 11. Weekly Auto-Report
- [ ] 12. Goal tracking + Trend prediction
- [ ] 13. Personal Score = Base Score + personal adjustments

### Dependencies

- Phase 2 complete (personal data, notes, ratings)
- Phase 3A complete (campaign results, daily data)
- Phase 3B complete (multi-source parsed data)

### Success Criteria

- Win Probability chính xác hơn AI Score cũ (đo qua feedback loop)
- Lifecycle prediction đúng hướng >= 70% trường hợp
- Morning Brief V2 trả lời 5 câu hỏi actionable
- Anomaly alerts phát hiện biến động trong 24h
- Confidence Level tăng tự nhiên theo lượng data

---

## Technical Dependencies

```
Phase 1 (Foundation)
  |
  v
Phase 2 (Personal Layer)
  |
  +---> Phase 3A (Campaign Tracker)
  |       |
  |       v
  |     Phase 3B (Data Parsers)
  |       |
  +-------+
  |
  v
Phase 4 (AI Intelligence)
  [cần data từ Phase 2 + 3A + 3B]
```

**Cross-phase shared resources:**
- Supabase PostgreSQL -- tất cả phase dùng chung
- Prisma schema -- mỗi phase thêm tables/fields mới
- Claude Haiku 4.5 API -- Phase 1 (scoring), Phase 4 (intelligence)
- Product model -- Phase 1 tạo, Phase 2 mở rộng fields, Phase 4 thêm Win Probability

---

## Risk Assessment

| Phase | Risk | Mức | Mitigation |
|-------|------|-----|------------|
| 2 | Calendar events hardcoded, cần update hàng năm | Thấp | Seed script tách riêng, dễ re-run |
| 3A | Daily input friction -- user quên nhập | Trung bình | Morning Brief nhắc nhở, input tối giản 3 fields/30s |
| 3B | CSV format thay đổi giữa các platform | Cao | Auto-detect linh hoạt, generic parser fallback |
| 3B | Merge logic match sai campaign | Trung bình | UI confirm trước merge, undo support |
| 4 | Không đủ data cho AI prediction chính xác | Cao | Confidence Level system, graceful degradation theo level |
| 4 | Claude API cost tăng với nhiều analysis | Trung bình | Cache results, batch processing, dùng Haiku (rẻ nhất) |
| All | Supabase free tier limits (500MB DB) | Thấp | Monitor usage, archive old snapshots nếu cần |

---

## Notes

- Phase 3A va 3B tách riêng để có thể build tuần tự, nhưng logic liên quan chặt (parsers feed campaigns)
- Phase 4 là phase phức tạp nhất, có thể chia nhỏ thêm khi bắt đầu implement
- Mọi phase đều backward compatible -- không break features của phase trước
- Instruction chi tiết từng phase: xem `docs/PHASE-*-.md`
