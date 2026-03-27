# Phase 1: Scoring Engine

## Priority: HIGH
## Status: Pending
## Effort: Medium

## Overview
Build the pure-function scoring module in `lib/niche-scoring/`. No DB, no API — just input → output functions. All logic is testable in isolation.

## Context
- Data source: ProductIdentity table (fastmossCategoryId, price, commissionRate, day28SoldCount, relateAuthorCount, relateVideoCount, deltaType)
- API already aggregates by category → we need per-category deltaType counts (NEW/SURGE) which aren't currently queried
- 29 L1 categories via FastMossCategory table (level=1, region=VN)

## Key Insights
- Existing verdict (PASS/CONSIDER/SKIP) uses simple threshold checks — new score is a continuous 0-100 replacement
- `revPerOrder` already calculated in summary API — reuse
- deltaType distribution per category needs new query (Phase 2)

---

## Files to Create

### `lib/niche-scoring/types.ts`

```typescript
export interface UserProfile {
  contentType: "ai_video" | "manual" | "both";
  buyProduct: boolean;
  targetIncome: 10_000_000 | 30_000_000 | 50_000_000;
  experience: "new" | "experienced";
}

export interface CategoryStats {
  categoryCode: number;
  categoryName: string;
  totalProducts: number;
  withSales: number;
  withKOL: number;
  avgCommission: number;  // percentage, e.g. 12.5
  avgPrice: number;       // VND
  revPerOrder: number;    // VND
  totalVideos: number;
  avgRating: number;
  // New fields needed from API:
  avgSales28d: number;      // average day28SoldCount per product
  newSurgeRatio: number;    // fraction of products with deltaType NEW or SURGE
  totalKOL: number;         // sum of relateAuthorCount across category
}

export interface KillResult {
  killed: boolean;
  reasons: string[];
}

export interface ScoreBreakdown {
  demandSignal: number;     // 0-100
  supplyGap: number;        // 0-100
  unitEconomics: number;    // 0-100
  opportunityScore: number; // 0-100 (weighted sum)
  fitScore: number;         // 0-100
  nicheScore: number;       // 0-100 (opportunity×0.6 + fit×0.4)
}

export interface ScoredNiche {
  categoryCode: number;
  categoryName: string;
  nicheScore: number;
  opportunityScore: number;
  fitScore: number;
  breakdown: ScoreBreakdown;
  kill: KillResult;
  highlights: string[];  // 2-3 bullet points for recommendation cards
  risks: string[];       // 1-2 risk bullets
  tags: string[];        // category AI tags
}
```

### `lib/niche-scoring/category-tags.ts`

Hardcoded map from Vietnamese category name → content tags.

```typescript
export type CategoryTag =
  | "product_photo"
  | "text_review"
  | "render_scene"
  | "demo_required"
  | "lifestyle"
  | "fashion"
  | "mixed";

// Map from fastmossCategoryId (L1 code) to tags
// Also maintain a nameVi → tags fallback for safety
export const CATEGORY_TAGS: Record<string, CategoryTag[]> = {
  // product_photo — can shoot product stills, no demo needed
  "Trang sức": ["product_photo"],
  "Phụ kiện thời trang": ["product_photo"],
  "Vải & Nội thất mềm": ["product_photo"],

  // text_review — review/unbox style, AI text overlay works
  "Sách & Audio": ["text_review"],
  "Máy tính & TB VP": ["text_review"],

  // render_scene — 3D render or lifestyle scene, no physical demo
  "Nội thất": ["render_scene"],
  "Cải thiện nhà cửa": ["render_scene"],

  // demo_required — need to show product in use
  "Làm đẹp": ["demo_required"],
  "Sức khỏe": ["demo_required"],
  "Mẹ & Bé": ["demo_required"],
  "Thực phẩm & Đồ uống": ["demo_required"],

  // lifestyle — can film usage casually
  "Thể thao": ["lifestyle"],
  "Đồ thú cưng": ["lifestyle"],
  "Đồ chơi & Sở thích": ["lifestyle"],

  // fashion — try-on / outfit content
  "Thời trang nữ": ["fashion"],
  "Thời trang nam": ["fashion"],
  "Thời trang trẻ em": ["fashion"],
  "Giày dép": ["fashion"],
  "Hành lý": ["fashion"],

  // mixed — various content approaches work
  "Đồ gia dụng": ["mixed"],
  "Đồ bếp": ["mixed"],
  "Thiết bị gia dụng": ["mixed"],
  "Dụng cụ & Phần cứng": ["mixed"],
  "Điện thoại & Điện tử": ["mixed"],
  "Ô tô & Xe máy": ["mixed"],
  "Sưu tầm": ["mixed"],
  "Đồ đã qua sử dụng": ["mixed"],
  "Thời trang Hồi giáo": ["mixed"],
};
```

### `lib/niche-scoring/kill-criteria.ts`

```typescript
export function evaluateKillCriteria(
  stats: CategoryStats,
  profile: UserProfile | null,
  tags: CategoryTag[]
): KillResult
```

Logic:
1. `stats.avgCommission < 3` → killed, reason: "Commission TB < 3%"
2. `stats.withSales < 10` → killed, reason: "Quá ít SP có doanh số"
3. `profile?.contentType === "ai_video" && tags.includes("demo_required")` → killed, reason: "Ngách cần demo — không phù hợp video AI"
4. `profile?.buyProduct === false && tags.includes("demo_required")` → killed, reason: "Ngách cần mua SP để quay"

Return `{ killed: reasons.length > 0, reasons }`.

### `lib/niche-scoring/opportunity-score.ts`

```typescript
export function computeOpportunityScores(
  allStats: CategoryStats[],
  targetIncome: number
): Map<number, { demand: number; supplyGap: number; unitEcon: number; total: number }>
```

**Normalization strategy**: percentile-rank across all 29 categories (not min-max to avoid outlier distortion).

```
function percentileRank(values: number[], value: number): number
  sorted = values.sort(asc)
  rank = index of value in sorted / (values.length - 1) * 100
```

**Demand signal (35%)**:
- `marketVolume = totalKOL × avgSales28d` per category
- Percentile-rank marketVolume → 0-100
- Higher = more demand = better

**Supply gap (30%)**:
- `videosPerKOL = totalVideos / totalKOL` (lower = less saturated = better)
- Invert: `supplyGapRaw = 1 / (videosPerKOL + 1)` then percentile-rank
- Bonus: `newSurgeRatio` > 0.3 → add 10 points (cap at 100)
- Growing market with low competition = opportunity

**Unit economics (35%)**:
- `revPerOrder` = avgPrice × avgCommission / 100
- `ordersNeeded = targetIncome / revPerOrder`
- `videosNeeded = ordersNeeded / 0.02` (2% estimated conversion rate)
- `feasibilityRatio = 450 / videosNeeded` (cap at 1.0, 450 = 15 videos/day × 30)
- Percentile-rank `feasibilityRatio` → 0-100

**Total**: `demand × 0.35 + supplyGap × 0.30 + unitEcon × 0.35`

### `lib/niche-scoring/fit-score.ts`

```typescript
export function computeFitScore(
  stats: CategoryStats,
  tags: CategoryTag[],
  profile: UserProfile
): number // 0-100
```

Base = 50 (neutral). Apply modifiers:

| Condition | Modifier |
|-----------|----------|
| `ai_video` + tag `product_photo` or `text_review` or `render_scene` | +25 |
| `ai_video` + tag `demo_required` | -30 (already killed, but just in case) |
| `ai_video` + tag `fashion` | -15 |
| `ai_video` + tag `lifestyle` | -10 |
| `manual` + tag `demo_required` | +10 (advantage) |
| `buyProduct=false` + tag `demo_required` | -25 |
| `experience=new` + `videosPerKOL > median` | -15 (high competition) |
| `experience=new` + `newSurgeRatio > 0.3` | +10 (growing = easier entry) |
| `targetIncome >= 50M` + `revPerOrder < 5000` | -20 (need too many videos) |
| `targetIncome >= 50M` + `revPerOrder > 15000` | +15 |

Clamp result to 0-100.

### `lib/niche-scoring/niche-scorer.ts`

Orchestrator:

```typescript
export function scoreNiches(
  allStats: CategoryStats[],
  profile: UserProfile | null
): ScoredNiche[]
```

1. For each category, resolve tags from `CATEGORY_TAGS` (lookup by categoryName)
2. Run `evaluateKillCriteria` — if killed, score=0
3. Run `computeOpportunityScores` (batch, all categories at once for percentile)
4. If profile exists, run `computeFitScore` per category
5. `nicheScore = opportunity × 0.6 + fit × 0.4` (if no profile, nicheScore = opportunity)
6. Generate `highlights` and `risks` strings based on score breakdown
7. Sort by nicheScore desc
8. Return ScoredNiche[]

**Highlight generation** (rule-based, no AI):
- If demand > 70: "Nhu cầu thị trường cao"
- If supplyGap > 70: "Ít cạnh tranh, nhiều cơ hội"
- If unitEcon > 70: "Hoa hồng cao, ít video cần thiết"
- If newSurgeRatio > 0.3: "Thị trường đang tăng trưởng"
- If fitScore > 70: "Phù hợp với phong cách nội dung của bạn"

**Risk generation**:
- If supplyGap < 30: "Cạnh tranh cao"
- If avgCommission < 8: "Hoa hồng thấp"
- If newSurgeRatio < 0.1: "Thị trường bão hòa"
- If feasibility < 0.5: "Cần nhiều video/ngày"

---

## Implementation Steps

1. Create `lib/niche-scoring/types.ts` with all interfaces
2. Create `lib/niche-scoring/category-tags.ts` with hardcoded map
3. Create `lib/niche-scoring/kill-criteria.ts` — evaluate kill criteria
4. Create `lib/niche-scoring/opportunity-score.ts` — percentile-based scoring
5. Create `lib/niche-scoring/fit-score.ts` — user constraint modifiers
6. Create `lib/niche-scoring/niche-scorer.ts` — orchestrator
7. Verify TypeScript compilation

## Success Criteria
- [ ] All types defined and exported
- [ ] Category tags cover all 29 categories
- [ ] Kill criteria correctly filters categories
- [ ] Opportunity score produces 0-100 for each category
- [ ] Fit score adjusts based on all 4 user preferences
- [ ] Final score = opportunity × 0.6 + fit × 0.4
- [ ] Highlights/risks generated for each category
- [ ] TypeScript compiles clean
