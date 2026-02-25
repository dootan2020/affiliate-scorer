# ROADMAP FINAL V2 — AI AFFILIATE CONTENT FACTORY

> Thay thế ROADMAP-FINAL.md (AI Secretary).
> Hướng mới: Content Factory — sản xuất 10+ video affiliate TikTok/ngày bằng AI.

---

## NORTH STAR

**App giúp user sản xuất 10+ video affiliate TikTok mỗi ngày — từ chọn SP, viết script, tạo prompt cho Kling/Veo3, đến caption + hashtag — rồi học từ kết quả để ngày càng chính xác.**

Đo thành công: số video sản xuất/ngày × tỷ lệ video có đơn hàng.

---

## FLOW TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│ 0. CAPTURE — Thu thập nhanh                                     │
│    Paste Links (product/video/shop) + FastMoss bulk upload      │
│    App tự nhận diện loại link → vào Inbox                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. ENRICH — Làm giàu (lazy, không scrape)                      │
│    Canonicalize URL + dedupe + metadata tối thiểu               │
│    Manual quick fields 10 giây nếu cần                          │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SCORE — Chấm điểm                                           │
│    Market Score (FastMoss data) + Content Potential Score        │
│    Score dựa trên data HIỆN CÓ, không chờ đủ 100%              │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BRIEF — Biến SP thành gói content                            │
│    5 angles + 10 hooks + 3 scripts + shot list                  │
│    Caption + CTA + prompt Kling/Veo3                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GENERATE — Sản xuất hàng loạt                                │
│    Batch generate 10+ video content cùng lúc                    │
│    Export Packs: scripts.md + prompts.json + checklist.csv      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PUBLISH + LOG — Đăng + ghi kết quả siêu nhẹ                 │
│    Paste link video đã đăng → match về asset                    │
│    Nhập 3 metrics tối thiểu (views, shares, comment hỏi link)  │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. LEARN — AI cập nhật                                          │
│    Hook/format/angle nào win → tăng weight                      │
│    Pattern SP dễ viral → ưu tiên                                │
│    Morning Brief: "Hôm nay sản xuất gì"                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## INPUT: 2 ĐƯỜNG VÀO

### Đường 1: Paste Links (chính, hàng ngày)

```
Một ô lớn. Paste 1 hoặc 20 link. App tự nhận diện:
├── TikTok Shop product URL → vào Inbox loại Product
├── TikTok video URL → vào Inbox loại Video (competitor research)
├── TikTok Shop URL → vào Inbox loại Shop
├── FastMoss product URL → vào Inbox loại Product
└── Link khác → flag "unknown", user chọn loại

Auto-dedupe: paste trùng link → không tạo rác.
```

### Đường 2: FastMoss XLSX upload (bulk, 1-2 lần/tuần)

```
Upload file → 300 SP cùng lúc + analytics chi tiết
├── Sales 7d, revenue, KOL count, commission
├── Snapshot → Delta (NEW/SURGE/COOL/STABLE/REAPPEAR)
└── Merge với SP đã có trong Inbox (canonical URL match)
```

Cả hai đường quy về **cùng 1 Inbox, cùng 1 product identity system.**

---

## INBOX PIPELINE

```
New → Enriched → Scored → Briefed → Published

New:        Vừa paste link / vừa import
Enriched:   Có metadata tối thiểu (tên, giá nếu có)
Scored:     Có Market Score + Content Potential Score
Briefed:    AI đã tạo scripts/prompts/captions
Published:  Video đã đăng TikTok, có link + metrics
```

---

## SCORING: 2 LOẠI

### Market Score (từ FastMoss/analytics data)
- Sales momentum, commission rate, KOL competition, price range
- Giống AI Score hiện tại, nâng cấp thêm Delta + Lifecycle

### Content Potential Score (MỚI — cho content factory)
- **3-second wow:** SP có gì gây chú ý ngay? (visual, giá sốc, hiệu quả rõ)
- **Số angle:** AI gợi ý được ≥5 góc content?
- **Nguyên liệu:** Có nhiều ảnh/review/UGC để dựng?
- **Dễ dựng AI:** Không cần cầm hàng thật, dựng bằng Kling/Veo3 được?
- **Rủi ro:** Claim y tế? Dễ hoàn? Dễ bị report?

Score dựa trên data HIỆN CÓ. Thiếu giá → vẫn score. Thiếu commission → flag, không block.

---

## CONTENT GENERATION

### Input cho AI (Claude API):
```
- Tên SP + mô tả + giá + category
- Ảnh SP (nếu có)
- Hook library (từ learning data)
- Format library (review/demo/compare/unbox/lifestyle)
- TikTok VN trends + rules
```

### Output per SP:
```
- 5 angles (góc tiếp cận khác nhau)
- 10 hooks (câu mở đầu 3 giây)
- 3 scripts theo 3 format (Problem-Solution / Compare / Review)
- Shot list (scene-by-scene)
- Caption + hashtag + CTA
- Prompt cho Kling/Veo3 (scene-by-scene)
```

### Batch: Chọn 4 SP × 3 video = 12 scripts + prompts + captions cùng lúc.

### Export Packs:
- `scripts.md` — đọc, chỉnh, quay theo
- `prompts.json` — paste vào Kling/Veo3
- `checklist.csv` — track tiến độ từng video

---

## LEARNING LOOP

```
Video đăng → metrics (views, likes, shares, saves, comments, orders)
                    ↓
             Reward Score
                    ↓
        Update weights: Hook / Format / Angle / Cluster
                    ↓
        Decay: pattern cũ → giảm weight dần
                    ↓
        Explore/Exploit: 70% hook đã win + 30% hook mới
                    ↓
        Rerank: SP + content suggestions ngày càng chính xác
```

---

## 5 PHASE BUILD

### Phase 1 ✅ DONE
- FastMoss XLSX upload + auto-score 367 SP
- Dashboard Top 10, detail page, dedup, snapshots
- Supabase PostgreSQL

### Phase 2 — Product Intelligence
- Paste Links parser + Inbox pipeline
- Product Identity + canonical URL + fingerprint dedupe
- Snapshot → Delta classification
- Content Potential Score
- **Instruction:** `PHASE-2-PRODUCT-INTELLIGENCE.md`

### Phase 3 — Content Factory (CORE)
- Brief generation (angles, hooks, scripts, prompts, captions)
- Batch generate + Export Packs
- Asset tracking (DRAFT → PUBLISHED)
- Compliance check (TikTok VN rules)
- **Instruction:** `PHASE-3-CONTENT-FACTORY.md`

### Phase 4 — Result + Learning
- Log results (paste TikTok links, nhập metrics)
- Reward score + learning weights + decay
- Explore/exploit + Win/Loss analysis
- Playbook tích lũy
- **Instruction:** `PHASE-4-RESULT-LEARNING.md`

### Phase 5 — Business Layer
- Commission tracking (optional, không block flow)
- Morning Brief (factory version)
- Weekly report + Goal tracking
- **Instruction:** `PHASE-5-BUSINESS.md`

---

## NGUYÊN TẮC KIẾN TRÚC (BẮT BUỘC)

### ❌ KHÔNG ĐƯỢC LÀM:
1. **KHÔNG build scraper/crawler** cho TikTok Shop. Auto-enrich = canonicalize + dedupe + metadata tối thiểu, KHÔNG scrape DOM.
2. **KHÔNG require tất cả fields** trước khi score. Score dựa trên data hiện có. Pipeline không chết vì thiếu 1 field.
3. **KHÔNG block flow vì thiếu commission/giá/rating.** Đây là fields optional, nhập sau được.
4. **KHÔNG auto-fetch data từ URL** ngoài canonical parse + dedupe. User nhập thủ công phần còn lại.

### ✅ PHẢI LÀM:
1. **Paste link phải nhanh** — quăng link vào = 1 giây, vào Inbox ngay.
2. **Enrich lazy** — field nào có thì dùng, thiếu thì bỏ qua.
3. **Giữ code hiện tại** — FastMoss upload, scoring, dashboard vẫn chạy.
4. **Migration có version** — không sửa trực tiếp DB.
5. **Code comments tiếng Việt.**

---

## TECH STACK

```
Frontend:   Next.js + TypeScript + Tailwind + shadcn/ui (giữ nguyên)
Database:   PostgreSQL — Supabase (giữ nguyên)
AI:         Claude API (generate scripts/captions/prompts)
Video:      Kling, Veo3, Freepik, Picsart (tools ngoài, app tạo prompt)
Deploy:     Vercel
Extension:  Chrome MV3 (Phase 4+, không phải MVP)
```

---

## MÀN HÌNH CHÍNH

```
/dashboard    — Morning Brief + Inbox stats + Quick paste
/inbox        — Paste Links box + Inbox cards (filter by state)
/sync         — FastMoss upload + Delta summary
/production   — Chọn SP → AI generate → Export Packs
/log          — Paste TikTok links + nhập metrics
/library      — Thư viện tất cả video + kết quả + filter
/insights     — Learning progress, playbook, weekly report
```

---

## THÀNH CÔNG

```
Tháng 1: 10+ video/ngày nhờ AI scripts, tiết kiệm 3 giờ/ngày
Tháng 2: AI biết hook/format nào win → scripts chính xác hơn
Tháng 3: Playbook hoàn chỉnh, commission tăng 2-3x
```
