# Scoring & Suggestions Logic Report

> Phân tích chi tiết từ codebase thực tế. Tham chiếu file:line chính xác.
> Data query từ production DB ngày 2026-03-05.

---

## Phan 1: Scoring Algorithm

### 1.1 Khi nao scoring trigger?

**Trigger chain: Upload -> Import -> AI Score -> Identity Score**

1. User upload file FastMoss qua `/sync` page
2. API `/api/upload/products` import products vao bang `Product`
3. Sau import, fire relay toi `/api/internal/score-batch` (`lib/import/fire-relay.ts`)
4. Score-batch tu dong chain: score 150 SP/request, neu con thi goi lai chinh no

**API endpoints:**
| Endpoint | Trigger | Loai |
|----------|---------|------|
| `POST /api/internal/score-batch` | Auto sau import | Batch relay chain |
| `POST /api/score` | Manual | Batch/all |
| `POST /api/inbox/score-all` | Manual "Cham lai" button | All non-archived |
| `POST /api/inbox/[id]/score` | Manual single | Single |

**Chunk size & concurrency** (`lib/ai/scoring.ts:36-38`):
- `CLAUDE_BATCH_SIZE = 30` — so SP gui cho AI moi lan
- `CLAUDE_CONCURRENCY = 3` — so batch chay song song
- `PARALLEL_WRITES = 20` — so DB writes song song
- `SCORE_CHUNK = 150` — so SP moi relay invocation (`app/api/internal/score-batch/route.ts:14`)

**Timeout:** `maxDuration = 60` (Vercel function timeout 60s, `score-batch/route.ts:4`)

### 1.2 AI Scoring (Product.aiScore)

**System prompt** (`lib/ai/prompts.ts:38-40`):
```
Ban la AI chuyen phan tich san pham affiliate cho thi truong Viet Nam.
Nhiem vu cua ban la cham diem san pham tu 0-100 dua tren cong thuc scoring duoc cung cap.
Luon tra ve JSON hop le, khong co van ban them vao ngoai JSON.
```

**Data gui cho AI:** Toan bo `Product` model (JSON.stringify), bao gom:
- `id`, `name`, `category`, `price`, `commissionRate`, `commissionVND`
- `sales7d`, `salesTotal`, `totalKOL`, `totalVideos`, `kolOrderRate`
- `salesGrowth7d` (estimated hoac real), `shopRating`, `platform`

**AI model:** Configurable qua `AiModelConfig` table, lookup by `taskType = "scoring"` (`lib/ai/claude.ts:25-35`). Multi-provider: Anthropic, OpenAI, Gemini (`lib/ai/call-ai.ts`).

**Token limit:** `MAX_TOKENS_SCORING = 4096` (`lib/ai/claude.ts:14`)

**AI tra ve** (`lib/ai/prompts.ts:65-81`):
```json
[{
  "id": "product_id",
  "aiScore": 85,
  "scoreBreakdown": {
    "commission": {"score": 80, "weight": 0.2, "weighted": 16},
    "trending": {"score": 100, "weight": 0.2, "weighted": 20},
    "competition": {"score": 60, "weight": 0.2, "weighted": 12},
    "contentFit": {"score": 70, "weight": 0.15, "weighted": 10.5},
    "price": {"score": 100, "weight": 0.15, "weighted": 15},
    "platform": {"score": 70, "weight": 0.1, "weighted": 7}
  },
  "reason": "Ly do ngan gon",
  "contentSuggestion": "Goi y video",
  "platformAdvice": "Goi y platform"
}]
```

**Parse response** (`lib/ai/scoring.ts:92-103`):
- Regex match JSON array: `text.match(/\[[\s\S]*\]/)`
- Parse JSON, fallback tra ve empty array neu loi
- Khong co retry khi parse fail — dung base score thay the

### 1.3 Base Formula Score (khong AI)

**File:** `lib/scoring/formula.ts`

**6 components, trong so mac dinh** (`formula.ts:23-30`):

| Component | Weight | Range | Logic |
|-----------|--------|-------|-------|
| Commission (20%) | 0.20 | 0-100 | Rate tiers: >=15%=100, >=10%=80, >=7%=60, >=4%=40, >=1%=20. Bonus +10 neu VND 30K-80K |
| Trending (20%) | 0.20 | 0-100 | Co salesGrowth7d: dung growth tiers. Khong co: dung ratio sales7d/salesTotal |
| Competition (20%) | 0.20 | 0-100 | KOL count tiers (<=5=100, <=15=80...). Video penalty (-5/-10/-15). KOL rate bonus |
| Content Fit (15%) | 0.15 | 50-100 | Category hotness +20, price range +15, sales volume +15 |
| Price (15%) | 0.15 | 20-100 | Sweet spot 150K-500K=100, 50K-150K=60, 500K-1M=70, >1M=40 |
| Platform (10%) | 0.10 | 50-100 | Both=100, TikTok high comm=80, Shopee=55-75 |

**Cong thuc:** `total = sum(component.score * component.weight)` — cap max 100 (`formula.ts:266-271`)

### 1.4 Hybrid Score

**Hai he thong score TACH BIET, luu o 2 bang khac nhau:**

#### Product.aiScore (bang `Product`)
`lib/ai/scoring.ts:155-157`:
```
blendedScore = aiScore_from_Claude * 0.6 + baseFormula.total * 0.4
```
- Neu Claude fail: `finalScore = baseFormula.total` (pure formula)
- Neu co personalization (>=30 feedback): them layer nua (xem 1.5)

#### ProductIdentity.combinedScore (bang `ProductIdentity`)
`lib/services/score-identity.ts:60-70`:
```
marketScore = product.aiScore ?? identity.marketScore
contentPotentialScore = calculateContentPotentialScore(...)
combinedScore = marketScore * 0.5 + contentPotentialScore * 0.5
```
- Neu chi co 1 trong 2: dung cai co
- `combinedScore` = **cai hien thi tren UI inbox** (da fix bug nay hom nay)

#### contentPotentialScore
`lib/scoring/content-potential.ts:52-113` — **Hoan toan formula, KHONG AI:**

| Component | Weight | Range | Logic |
|-----------|--------|-------|-------|
| 3-second wow (20%) | /100 | 0-20 | Co anh +8, gia < 100K +12 |
| Goc content (20%) | /100 | 0-20 | Category angles * 3 |
| De dung AI (20%) | /100 | 0-20 | Category AI friendliness |
| KOL/video UGC (20%) | /100 | 0-23 | KOL tiers + video bonus |
| Commission (10%) | /100 | 0-10 | Rate tiers |
| Rui ro (-) | /100 | -10-+10 | Keyword scan, tru diem y te |

**maxScore = 100**, normalize: `round(score / maxScore * 100)`

#### marketScore
= `product.aiScore` (legacy AI score tu bang Product)
Hoac: `identity.marketScore` tu import (FastMoss co san aiScore)

#### aiScore vs combinedScore: KHAC NHAU
- `aiScore` = 60% Claude + 40% base formula — luu o `Product`
- `combinedScore` = 50% marketScore + 50% contentPotential — luu o `ProductIdentity`
- `marketScore` = `aiScore` copy sang identity
- **Ket qua:** combinedScore != aiScore vi them contentPotential va thay doi ty le

### 1.5 Personalization Layer

**File:** `lib/scoring/personalize.ts`

**Dieu kien:** `feedbackCount >= 30` (`personalize.ts:71`)

**Hien tai: feedbackCount = 0** — personalization CHUA BAO GIO active.

**Cong thuc (khi active)** (`personalize.ts:123-128`):
```
personalizedTotal = baseScore * 0.5 + historicalMatch * 0.3 + contentType * 0.1 + audience * 0.1
```

- `historicalMatch`: so sanh voi past successful products (category, price, commission, platform)
- `contentType`: bonus khi co known good video type patterns
- `audience`: platform match voi best-performing ad platform
- **Cache:** 5-minute TTL, invalidate khi insert/update feedback

### 1.6 Data thuc te (Production DB, 2026-03-05)

#### Distribution

| Metric | Count | Min | Max | Avg | Median | Spread |
|--------|-------|-----|-----|-----|--------|--------|
| combinedScore | 394 | 46 | 79 | 66.2 | 67 | **33** |
| contentPotential | 394 | 41 | 93 | 71.1 | 74 | 52 |
| marketScore | 392 | 35 | 93 | 60.8 | 60 | 58 |

#### Score histogram (combinedScore)
```
40-49: ████ 4 (1%)
50-59: ██████████████████████████████████████████ 42 (11%)
60-69: ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ 240 (61%)
70-79: ██████████████████████████████████████████████████████████████████ 108 (27%)
```

**61% SP nam trong bucket 60-69.** Range cuc ky hep.

#### Category avg scores (top 5 va bottom 5)

| Category | Avg | Count |
|----------|-----|-------|
| Sua chua nha cua | 73.6 | 5 |
| Suc khoe | 70.8 | 12 |
| Do gia dung | 69.5 | 43 |
| Sach, tap chi & am thanh | 69.3 | 4 |
| The thao & Ngoai troi | 69.2 | 5 |
| ... | ... | ... |
| May tinh & Thiet bi Van phong | 60.5 | 29 |
| Do choi & so thich | 60.0 | 1 |
| Trang phuc nam & Do lot | 59.4 | 7 |
| Do noi that | 57.0 | 1 |
| **Cham soc sac dep** | **65.5** | **124** |

**Nhan xet:** Category lon nhat (Cham soc sac dep, 124 SP) lai co avg score thap hon muc trung binh.

#### aiScore vs combinedScore (sample 20 SP)
```
aiScore=62 → market=62, content=50 → combined=56
aiScore=52 → market=52, content=78 → combined=65
aiScore=73 → market=73, content=71 → combined=72
aiScore=55 → market=55, content=85 → combined=70
aiScore=44 → market=44, content=78 → combined=61
```

**Nhan xet:** contentPotentialScore thuong cao hon aiScore (avg 71 vs 61). Khi blend 50/50, combinedScore bi keo len — giam phan biet giua SP tot va trung binh.

#### Clustering
- **0 SP co combinedScore null** — tat ca 394 SP deu co score
- **240/394 (61%) SP co score 60-69** — CLUSTERING NGHIEM TRONG
- Spread chi 33 diem (46-79) — qua hep de phan biet

#### Feedback & Learning
- **Feedback count: 0** — chua co feedback nao
- **LearningWeightP4: []** — chua co learning weight nao
- **Latest learning weights:** van la default `{commission: 0.2, trending: 0.2, ...}`
- Personalization layer: **INACTIVE** (can 30 feedback)

### 1.7 Van de phat hien

1. **Score range qua hep (33 diem, 46-79):** 61% SP nam trong bucket 60-69. Nguoi dung khong the phan biet SP tot va SP trung binh. Nguyen nhan: contentPotentialScore (avg 71) keo marketScore (avg 61) len, 50/50 blend lam mat discriminative power cua AI scoring.

2. **contentPotentialScore INFLATE score:** Cong thuc content-potential.ts cho diem kha de — co anh (+8), co category match (+20), co KOL (+18). Hau het SP FastMoss deu co du data → content score 70-90 la binh thuong. Khi blend 50/50 voi marketScore (thap hon), ket qua bi keo len va flat.

3. **AI scoring KHONG dung learning weights:** `lib/ai/scoring.ts` gui weights cho Claude trong prompt, nhung weights van la DEFAULT (0.2/0.2/0.2/0.15/0.15/0.1). Chua co feedback → chua co learning → weights khong bao gio thay doi.

4. **Hai he thong score doc lap va confusing:**
   - `Product.aiScore` = 60% Claude + 40% formula
   - `ProductIdentity.combinedScore` = 50% marketScore(=aiScore) + 50% contentPotential
   - UI truoc do hien `aiScore` thay vi `combinedScore` (bug da fix hom nay)
   - Sort dung `combinedScore` nhung display dung `aiScore` = inconsistent (DA FIX)

5. **Personalization = dead code:** 0 feedback, can 30 de activate. Layer nay chua bao gio chay.

6. **Category normalization gap:** `content-potential.ts` co 10 categories Tieng Viet. `formula.ts` co 21 HOT_CATEGORIES. Nhung FastMoss tra ve categories khac (VD: "Sua chua nha cua", "May tinh & Thiet bi Van phong") — nhieu category khong match → mat bonus.

7. **AI scoring consistency:** Khong co mechanism verify consistency — cung SP gui 2 lan co the duoc diem khac. Khong co unit test cho scoring prompt.

---

## Phan 2: Suggestions Algorithm

### 2.1 Data fetch

**File:** `lib/suggestions/compute-smart-suggestions.ts:88-117`

5 queries song song:

| Query | Table | Filter | Limit |
|-------|-------|--------|-------|
| Products | ProductIdentity | inboxState IN [scored, enriched], lifecycleStage NOT IN [declining, dead] | **100** (ORDER BY combinedScore DESC) |
| Weights | LearningWeightP4 | scope IN [category, hook_type, format] | all |
| Calendar | CalendarEvent | startDate trong 7 ngay toi | 5 |
| Channels | TikTokChannel | isActive = true | all |
| Morning Brief | DailyBrief | briefDate >= today | 1 |

**Hien tai:** LearningWeightP4 = empty, CalendarEvent = likely empty → chi dung products + channels.

### 2.2 SmartScore formula

**File:** `compute-smart-suggestions.ts:151-153`

```
smartScore = base * 0.55 + categoryBonus * 0.15 + deltaBonus * 0.05
           + calendarBonus * 0.10 + contentPotential * 0.10 + recencyBonus * 0.05
```

| Component | Weight | Range | Source | Tinh |
|-----------|--------|-------|--------|------|
| base | 0.55 | 0-100 | `combinedScore` | Truc tiep |
| categoryBonus | 0.15 | 0-100 | LearningWeightP4 | `catWeight * 50`, cap 100. **Hien tai = 0 vi P4 empty** |
| deltaBonus | 0.05 | -20–100 | deltaType | REAPPEAR=100, SURGE=70, NEW=40, STABLE=0, COOL=-20 |
| calendarBonus | 0.10 | 0/100 | CalendarEvent | Binary: 100 neu match keyword, 0 neu khong. **Hien tai = 0** |
| contentPotential | 0.10 | 0-100 | contentPotentialScore | Truc tiep |
| recencyBonus | 0.05 | 0/50/100 | createdAt | <=3 ngay=100, <=7 ngay=50, >7=0 |

**Vi P4 va Calendar deu empty:**
```
smartScore ≈ combinedScore * 0.55 + delta * 0.05 + contentPotential * 0.10 + recency * 0.05
```
= 75% cua smartScore den tu combinedScore va contentPotential — **gần như chỉ là combinedScore sắp xếp lại**.

#### Vi du tinh voi 3 SP thuc te:

**SP1 (combinedScore=79, content=79, delta=NEW, 3 ngay):**
```
smart = 79*0.55 + 0*0.15 + 40*0.05 + 0*0.10 + 79*0.10 + 100*0.05
      = 43.5 + 0 + 2 + 0 + 7.9 + 5 = 58
```

**SP2 (combinedScore=67, content=74, delta=STABLE, 30 ngay):**
```
smart = 67*0.55 + 0 + 0*0.05 + 0 + 74*0.10 + 0*0.05
      = 36.9 + 0 + 0 + 0 + 7.4 + 0 = 44
```

**SP3 (combinedScore=46, content=41, delta=SURGE, 1 ngay):**
```
smart = 46*0.55 + 0 + 70*0.05 + 0 + 41*0.10 + 100*0.05
      = 25.3 + 3.5 + 4.1 + 5 = 38
```

**Nhan xet:** SmartScore range = 38-58. Con hep hon combinedScore. Suggestions thu tu gan nhu giong inbox sort.

### 2.3 Channel matching

**Niche map** (`lib/suggestions/niche-category-map.ts:4-12`):

| Niche | Categories |
|-------|-----------|
| beauty_skincare | cham soc sac dep, cham soc ca nhan, my pham |
| home_living | do gia dung, do dung nha bep, noi that |
| tech | dien thoai, do dien tu, cong nghe |
| fashion | phu kien thoi trang, quan ao, giay dep, tui xach |
| health | suc khoe, y te, thuc pham chuc nang |
| food | do an, do uong, thuc pham |
| garden | sua chua nha cua, vuon, cay canh |

**Categories CHUA duoc map:**
- "Sach, tap chi & am thanh" → khong match niche nao
- "The thao & Ngoai troi" → khong co niche sports
- "Trang phuc nu & Do lot" / "Trang phuc nam" → `fashion` chi co "quan ao" nhung FastMoss tra ve "Trang phuc nu & Do lot"
- "O to & xe may" → khong match
- "Do choi & so thich" → khong match
- "Thiet bi gia dung" → home_living chi co "do gia dung", khong co "thiet bi gia dung"

**Fallback** (`niche-category-map.ts:28-29`): bidirectional string includes — `catLower.includes(nicheLower) || nicheLower.includes(catLower)`. Nay co the match sai (VD: niche "home" match bat ky category nao co chu "home").

**ContentMix bonus** (`compute-smart-suggestions.ts:49-67`):
```
bonus = (review% / total%) * min(100, contentPotentialScore)
       + (selling% / total%) * min(100, commissionRate * 5)
       + (entertainment% / total%) * deltaScore (neu > 0)
```
Cap max 100, nhan 0.10 khi cong vao smartScore (`line 196`).

### 2.4 Ranking + selection

**File:** `compute-smart-suggestions.ts:205-213`

Per channel:
1. Filter theo niche (neu co)
2. Sort by smartScore DESC
3. Tag: `proven` (catWeight > 1.0 HOAC base >= 75) vs `explore` (con lai)
4. Selection: **1 explore dau tien + fill proven len 10, roi fill explore len 10**
5. Dedup: moi SP xuat hien toi da 2 lan across channels (`usedCounts`)
6. Flat list: top 20 by smartScore (khong group theo channel)

**Hien tai vi P4 empty:** `hasWeights = false` → tag dua tren `base >= 75`:
- `proven` = SP co combinedScore >= 75
- `explore` = SP co combinedScore < 75
- Chi 108/394 SP co score 70-79, va max la 79 → **KHONG CO SP NAO proven (can >= 75 nhung phan lon la 60-69)**

→ Tat ca SP deu tagged "explore" → explore/proven ratio = 100/0 → **explore/exploit mechanism broken**.

### 2.5 So sanh Scoring vs Suggestions

| Aspect | Scoring (combinedScore) | Suggestions (smartScore) |
|--------|------------------------|-------------------------|
| Input data | Product + Identity fields | combinedScore + contentPotential + delta + recency |
| AI involved | Yes (Claude/OpenAI/Gemini) | **No** — pure formula |
| Range thuc te | 46-79 (spread 33) | ~38-58 (spread ~20) |
| Clustering | 61% o 60-69 | Tuong tu, van cluster |
| Personalization | Co (nhung inactive) | Qua LearningWeightP4 (nhung empty) |

**SP #1 inbox (combinedScore=79) vs SP #1 suggestions:** Gan nhu **giong nhau** vi smartScore weight 55% tu combinedScore. Suggestions chi re-rank nhe dua tren delta va recency.

**SP combinedScore cao + smartScore thap?** Chi xay ra khi SP la COOL delta (-20 * 0.05 = -1 diem) hoac > 7 ngay (mat 5 diem recency). Chenh lech toi da ~6 diem — khong du de dao thu tu nhieu.

**Scoring va Suggestions CO dependent:** Suggestions dung `combinedScore` lam input chinh (55%). Nhung suggestions KHONG dung `aiScore` — dung `combinedScore` (da bao gom contentPotential).

### 2.6 Van de phat hien

1. **categoryBonus = 0 (ALWAYS):** LearningWeightP4 empty → 15% trong so cua smartScore = 0. Day la component lon thu 2 sau base — mat 15% discriminative power.

2. **calendarBonus = 0 (MOST LIKELY):** CalendarEvent table trong hoac khong co events sap toi → 10% trong so = 0.

3. **Explore/exploit BROKEN:** Threshold proven = `base >= 75`. Nhung max combinedScore = 79 va chi 108 SP co score 70-79. Phan lon SP = explore → khong co proven/explore ratio enforce.

4. **SmartScore range qua hep (~20 diem):** Vi 75% den tu 2 fields da hep (combinedScore 46-79 va contentPotential 41-93), ket qua smartScore con hep hon. Suggestions thu tu gan nhu la combinedScore sort.

5. **ContentMix bonus too weak:** Bonus * 0.10 = toi da +10 diem → khong du de thay doi ranking.

6. **Niche mapping thieu:** 5-7 categories FastMoss khong match niche nao → SP bi filter sai hoac miss channel suggestions.

---

## Phan 3: De xuat cai thien

### Scoring

1. **Giam weight cua contentPotentialScore trong combinedScore:** Hien tai 50/50. Nen la 70% marketScore + 30% contentPotential (hoac 60/40). contentPotential inflate score vi hau het SP deu co data → score 70+.

2. **Mo rong score range:** Them normalization buoc cuoi — spread score ra 0-100 thay vi cluster o 60-70. VD: `normalizedScore = (score - min) / (max - min) * 100`.

3. **Don gian hoa he thong score:** Hien tai co 3 layer score (AI, base formula, contentPotential) voi 2 lop blending khac nhau (60/40 va 50/50). Nen merge thanh 1 pipeline duy nhat.

4. **Category normalization:** Map FastMoss Vietnamese categories day du hon. Hien tai nhieu category mat bonus vi khong match.

### Suggestions

5. **Fix explore/proven threshold:** Dung percentile thay vi absolute threshold. VD: top 25% = proven, bottom 75% = explore. Hoac dung median.

6. **Tang weight cua delta va recency:** Hien tai chi 5% moi cai. Day la 2 signals quan trong nhat de phan biet SP — nen tang len 10-15% moi cai.

7. **Populate LearningWeightP4 va CalendarEvent:** 25% trong so cua smartScore (categoryBonus + calendarBonus) hien tai = 0. Can co data de suggestions thuc su thong minh.

8. **Mo rong niche map:** Them sports, books, toys, automotive, appliances. Fix partial match "Trang phuc nu & Do lot" → fashion.

### Ket noi 2 he thong

9. **Suggestions nen dung aiScore truc tiep** thay vi combinedScore (da bao gom contentPotential). Roi cong them contentPotential rieng voi weight khac. Hien tai: suggestions nhan contentPotential 2 lan (1 lan qua combinedScore, 1 lan truc tiep).

10. **Tao feedback loop:** Khi user chon SP tu suggestions → lam content → log ket qua → update LearningWeightP4 → suggestions ngay cang chinh xac. Hien tai loop nay bi dut vi feedback = 0.

---

## Tham chieu file

| File | Vai tro |
|------|---------|
| `lib/ai/scoring.ts` | AI scoring pipeline, batch processing |
| `lib/ai/prompts.ts` | System/user prompts cho Claude |
| `lib/ai/call-ai.ts` | Multi-provider AI caller |
| `lib/ai/claude.ts` | Anthropic SDK caller, model config |
| `lib/scoring/formula.ts` | Base score formula (6 components) |
| `lib/scoring/weights.ts` | Learning weight management |
| `lib/scoring/personalize.ts` | Personalization layer (inactive) |
| `lib/scoring/content-potential.ts` | Content potential score |
| `lib/services/score-identity.ts` | Identity score sync (combinedScore) |
| `lib/suggestions/compute-smart-suggestions.ts` | Smart suggestions algorithm |
| `lib/suggestions/niche-category-map.ts` | Channel-product niche matching |
| `lib/suggestions/build-suggestion-reason.ts` | Reason string builder |
| `app/api/internal/score-batch/route.ts` | Score relay chain |
| `lib/inbox/sync-identity.ts` | Product → Identity sync on import |
