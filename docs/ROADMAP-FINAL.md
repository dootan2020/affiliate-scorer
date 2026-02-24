# ROADMAP FINAL — AI THƯ KÝ AFFILIATE CÁ NHÂN

> Version cuối cùng. Merge V3 + AI Intelligence Supplement.
> Mọi file instruction (Phase 2-4) tham chiếu document này.

---

## NORTH STAR

**App biết MỌI THỨ về business affiliate của user → đề xuất HÀNH ĐỘNG cụ thể mỗi ngày.**

Giống Google Analytics + Facebook Pixel: càng nhiều data → càng thông minh.
Output không phải biểu đồ — mà là "hôm nay làm gì, theo thứ tự nào".
Đo thành công: số tiền lãi ròng/tháng mà user kiếm được nhờ gợi ý từ AI.

---

## FLOW TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA IN (liên tục)                       │
│                                                                   │
│  Upload thường xuyên:          Nhập trong app:                   │
│  ├── FastMoss XLSX (SP mới)    ├── Ghi chú cá nhân cho SP       │
│  ├── FB/TikTok Ads export      ├── Đánh giá shop                │
│  ├── Shopee Affiliate report   ├── Kết quả campaign (3 fields)  │
│  ├── Commission statements     ├── Link affiliate               │
│  ├── KaloData, YouTube Ads...  └── Content links (video/post)   │
│  └── Bất kỳ file nào mới                                        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI XỬ LÝ (học liên tục)                    │
│                                                                   │
│  ├── Win Probability Score (market + personal + timing + risk)   │
│  ├── Product Lifecycle (rising → hot → peak → declining)         │
│  ├── Pattern recognition (category, giá, content, channel)       │
│  ├── Win/Loss analysis (tại sao thắng/thua)                     │
│  ├── Anomaly detection (sales tụt, ROAS giảm, KOL spike)        │
│  ├── Competitive intelligence (KOL tracker, market trends)       │
│  ├── Budget optimization (portfolio allocation)                   │
│  └── Confidence tăng dần theo lượng data                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               OUTPUT — 5 CÂU HỎI MỖI NGÀY                      │
│                                                                   │
│  1. "SP nào nên chạy?" → Win Probability + Lifecycle            │
│  2. "Chạy ở đâu, cách nào?" → Channel + Content gợi ý          │
│  3. "Bao nhiêu tiền?" → Budget allocation                       │
│  4. "Cái đang chạy cần chỉnh gì?" → Alerts + Optimization      │
│  5. "Nhìn lại thì sao?" → Win/Loss Analysis + Playbook         │
│                                                                   │
│  Dạng output: Morning Brief với hành động có thứ tự ưu tiên    │
└─────────────────────────────────────────────────────────────────┘
```

---

## USER WORKFLOW

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. TÌM  │───▶│ 2. CHỌN  │───▶│ 3. LÀM   │───▶│ 4. CHẠY  │───▶│ 5. ĐO    │
│ sản phẩm│    │ SP chạy  │    │ content  │    │ campaign │    │ kết quả  │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │              │               │               │               │
     ▼              ▼               ▼               ▼               ▼
  FastMoss      Win Prob +      Gợi ý style,    Budget gợi ý,   Lãi/lỗ,
  KaloData      ghi chú,       thời lượng,      phân bổ,        win/loss
  upload        lifecycle      channel          alerts          analysis
```

---

## DATA SOURCES

| # | Nguồn | Format | Cách vào | Khi nào |
|---|---|---|---|---|
| 1 | FastMoss sản phẩm | XLSX | Upload | 1-2 lần/tuần |
| 2 | KaloData sản phẩm | CSV | Upload | Khi dùng |
| 3 | Facebook Ads | CSV | Upload | Sau campaign |
| 4 | TikTok Ads | CSV | Upload | Sau campaign |
| 5 | Shopee Ads | CSV | Upload | Sau campaign |
| 6 | YouTube Ads | CSV | Upload | Khi dùng |
| 7 | Google Ads | CSV | Upload | Khi dùng |
| 8 | TikTok Affiliate report | CSV/Excel | Upload | Cuối tuần/tháng |
| 9 | Shopee Affiliate report | CSV/Excel | Upload | Cuối tuần/tháng |
| 10 | Commission statements | CSV/Manual | Upload + nhập tay | Khi nhận tiền |
| 11 | Content (video/post) | Link + ghi chú | Nhập trong app | Khi đăng |
| 12 | Ghi chú cá nhân | Text | Nhập trong app | Bất kỳ lúc nào |
| 13 | Đánh giá shop | Rating + text | Nhập trong app | Khi làm việc với shop |
| 14 | Kết quả campaign | 3 fields | Nhập trong app | Hàng ngày (30s) |
| 15 | Organic traffic | CSV | Upload | Khi có |

Upload file khi có. Nhập tay khi nhanh. Cả hai hợp lệ. Auto-detect file type.

---

## 4 PHASE

### PHASE 1: FOUNDATION ✅ DONE
- FastMoss XLSX upload + auto-score 367 SP
- Trang chi tiết (radar, gợi ý, ước tính lợi nhuận, SP tương tự)
- Dashboard Top 10, dedup logic, historical tracking
- Supabase PostgreSQL

### PHASE 2: PERSONAL LAYER
- Ghi chú + rating cho SP, đánh giá shop, link affiliate
- Lịch sale/mùa vụ (seed 18 events), thu chi thủ công
- Insights redesign (5 tabs), Dashboard widget "Sắp tới"
- **Instruction:** `PHASE-2-PERSONAL-LAYER.md`

### PHASE 3: CAMPAIGN TRACKER + PARSERS
- 3A: Campaign lifecycle, daily input, Morning Brief, goal tracking
- 3B: Parsers (FB/TikTok/Shopee/YouTube/Google Ads, Affiliate reports, KaloData)
- Upload auto-detect, merge parser data → campaign tracker
- **Instructions:** `PHASE-3A-CAMPAIGN-TRACKER.md` + `PHASE-3B-DATA-PARSERS.md`

### PHASE 4: AI INTELLIGENCE
- Win Probability Score, Product Lifecycle tracking
- Win/Loss Analysis, Pattern Library (playbook cá nhân)
- Budget Portfolio, Channel + Content optimization
- Competitive Intelligence, Anomaly Detection
- Morning Brief V2 (5 câu hỏi), Weekly report, Goal tracking
- **Instruction:** `PHASE-4-AI-INTELLIGENCE.md`

---

## WIN PROBABILITY SCORE

Thay thế AI Score đơn thuần:

```
Win Probability = f(Market 40%, Personal Fit 30%, Timing 15%, Risk 15%)

Market (40%):
├── Commission rate vs average
├── Sales momentum (tuần này vs tuần trước)
├── Price sweet spot thị trường
└── KOL competition level

Personal Fit (30%):
├── Category match (user giỏi category này?)
├── Price range match (sweet spot CỦA USER?)
├── Platform match (user mạnh platform nào?)
├── Content style match (SP phù hợp style user?)
└── Shop trust (đã làm shop này? kết quả?)

Timing (15%):
├── Seasonal relevance (sale sắp tới?)
├── Product lifecycle (rising/hot/peak/declining?)
└── Trend momentum (sales tăng/giảm?)

Risk (15%):
├── KOL competition spike
├── Shop reliability
├── Price war
└── Category saturation
```

---

## PRODUCT LIFECYCLE

Từ ProductSnapshot (upload FastMoss thường xuyên):

```
●────●────●────○────○
Mới  Rising  Hot  Peak  Declining

Rising: Sales tăng >50%, KOL chưa nhiều → CỬA SỔ VÀNG
Hot: Sales tăng, KOL đổ xô → CẠNH TRANH CAO
Peak: Sales ổn định → BÃO HÒA
Declining: Sales giảm >20% → RÚT RA
```

---

## MORNING BRIEF

```
☀️ Morning Brief — [Ngày]

═══ HÔM NAY LÀM GÌ ═══
1. 🔴 [Urgent: pause/stop]
2. 🟢 [Opportunity: scale/start]
3. 🟡 [Prepare: content/upcoming sale]
4. 🔵 [Routine: nhập kết quả, check data]
5. ⚪ [Discover: SP mới match pattern win]

═══ TỔNG QUAN ═══
💰 Thu chi tuần | 📊 Campaigns active | 📈 ROAS trend
📅 Sự kiện sắp tới | 🎯 Target progress

═══ CẢNH BÁO ═══
⚠️ Anomaly alerts
```

Empty state (chưa có campaigns):
```
☀️ Bắt đầu ngày mới!
Chưa có campaigns. Xem Top 10 SP và chọn SP đầu tiên!
📅 [Sự kiện sắp tới]
```

---

## CONFIDENCE LEVELS

```
Level 0 — CƠ BẢN (chỉ FastMoss):
  Score theo market data. Không gợi ý cá nhân.

Level 1 — SƠ KHỞI (1-2 campaigns):
  Bắt đầu thấy category/platform preference.

Level 2 — TRUNG BÌNH (3-5 campaigns + notes):
  Win Probability, sweet spot giá, content style.

Level 3 — CAO (6-10 campaigns + financial):
  Budget allocation, anomaly detection, prediction.

Level 4 — CHUYÊN GIA (11+ campaigns, 2+ tháng):
  Full playbook, trend prediction, goal tracking.
```

---

## ANTI-PATTERNS

| ❌ Không | ✅ Thay bằng |
|---|---|
| AI output = biểu đồ/số | AI output = "làm gì, thứ tự nào" |
| Build 10 parser cùng lúc | FB + TikTok trước, còn lại add dần |
| Chờ "đủ data" mới hoạt động | Gợi ý từ ngày 1, cải thiện dần |
| Score SP chung cho mọi người | Win Probability CÁ NHÂN hóa |
| Không biết SP lên hay xuống | Product Lifecycle tracking |

---

## SCHEMA PRINCIPLES

1. JSONB cho flexible data (dailyResults, metadata)
2. Nullable cho fields tương lai
3. Campaign là trung tâm workflow
4. Auto-calculate (roas, profitLoss từ raw data)
5. Timestamps everywhere
6. Dedup cross-source (cùng SP từ FastMoss + Shopee → merge)
