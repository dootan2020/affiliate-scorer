# Phase 02: AI Prompt Redesign — Rubric Anchoring

## Priority: HIGH
## Status: Pending

## Context
- Current prompt: vague "chấm điểm 0-100" with weight formula
- AI output inconsistent: same product scored differently on re-run
- No anchor examples → AI has no calibration reference
- Cross-model drift: Gemini vs Claude may score differently

## Current Problems (from audit)

1. **System prompt too vague**: "chấm điểm sản phẩm từ 0-100" — no guidance on what 80 vs 50 means
2. **No anchor examples**: AI has no reference for what a "90-point product" looks like
3. **Formula in prompt redundant**: We already compute base formula locally — asking AI to re-compute the same formula wastes tokens
4. **No rubric**: Each component says "score 0-100" but no criteria for specific scores
5. **Holistic scoring mixes with rubric**: AI asked to produce both `aiScore` (holistic) and `scoreBreakdown` (component) — contradictory

## Solution: Rubric-Anchored Expert Assessment

### Key Design Decisions

**Use AI for what AI is good at — qualitative judgment, not math:**
- AI evaluates product QUALITY factors formula can't capture
- Formula handles quantitative data (commission, sales, KOL count)
- AI focuses on: market timing, brand quality, content potential, risk assessment, consumer demand signals

**Rubric scoring > holistic scoring:**
- Each criterion has explicit rubric with 5 tiers (1-5 stars → 20/40/60/80/100)
- More consistent across models and invocations
- Easier to calibrate

### New AI Scoring Prompt

```typescript
// lib/ai/prompts.ts — buildScoringPrompt() rewrite

const system = `Bạn là chuyên gia affiliate marketing TikTok Shop Việt Nam với 5+ năm kinh nghiệm.
Đánh giá sản phẩm cho creator muốn làm video bán hàng affiliate.

QUAN TRỌNG: Chấm điểm CHÍNH XÁC theo rubric dưới đây. Đừng cho điểm cao quá dễ dàng.
Điểm trung bình nên khoảng 50-60. Chỉ SP thật sự xuất sắc mới đạt 80+.

## Rubric chấm điểm (mỗi tiêu chí 1-5 sao):

### 1. Nhu cầu thị trường (market_demand) — SP có người muốn mua không?
⭐ (20): SP ngách rất hẹp, ít ai cần, không trending
⭐⭐ (40): Có nhu cầu nhưng không nổi bật, thị trường bão hòa
⭐⭐⭐ (60): Nhu cầu ổn, có tìm kiếm, phù hợp một segment
⭐⭐⭐⭐ (80): Nhu cầu cao, đang hot, nhiều người tìm kiếm
⭐⭐⭐⭐⭐ (100): Viral potential, giải quyết pain point phổ biến, trending mạnh

### 2. Chất lượng & uy tín (quality_trust) — SP có đáng tin không?
⭐ (20): Không rõ nguồn gốc, mô tả sơ sài, có dấu hiệu hàng kém chất lượng
⭐⭐ (40): SP tạm được nhưng không nổi bật, review trung bình
⭐⭐⭐ (60): SP ổn, có thương hiệu nhỏ, mô tả rõ ràng
⭐⭐⭐⭐ (80): SP tốt, thương hiệu uy tín, review tốt, có chứng nhận
⭐⭐⭐⭐⭐ (100): SP xuất sắc, top thương hiệu, best-seller ngành

### 3. Tiềm năng viral (viral_potential) — Dễ làm video hay không?
⭐ (20): Nhàm chán, khó demo, không có wow factor
⭐⭐ (40): Có thể demo nhưng video sẽ bình thường
⭐⭐⭐ (60): Có góc content hấp dẫn, before/after khá
⭐⭐⭐⭐ (80): Dễ viral — reaction mạnh, transformation rõ, visual đẹp
⭐⭐⭐⭐⭐ (100): Chắc chắn viral — wow factor cực mạnh, trigger cảm xúc

### 4. Rủi ro (risk) — Bán SP này có rủi ro gì?
⭐ (20): Rủi ro cao — claim y tế, dễ hoàn, chất cấm, dễ bị report
⭐⭐ (40): Có rủi ro — SP nhạy cảm, tỷ lệ hoàn cao, cạnh tranh giá khốc liệt
⭐⭐⭐ (60): Rủi ro trung bình — SP bình thường, không vấn đề lớn
⭐⭐⭐⭐ (80): Rủi ro thấp — SP an toàn, ít hoàn, category ổn định
⭐⭐⭐⭐⭐ (100): Gần như không rủi ro — SP thiết yếu, repeat purchase, uy tín cao

Trả về JSON array, KHÔNG text thêm. Mỗi SP:`;

const outputFormat = `[{
  "id": "product_id",
  "scores": {
    "market_demand": 60,
    "quality_trust": 40,
    "viral_potential": 80,
    "risk": 60
  },
  "aiScore": 58,
  "reason": "1-2 câu giải thích điểm số",
  "contentAngle": "Góc video hay nhất cho SP này"
}]

QUAN TRỌNG:
- aiScore = TRUNG BÌNH CÓ TRỌNG SỐ: market_demand×0.35 + quality_trust×0.25 + viral_potential×0.25 + risk×0.15
- Mỗi tiêu chí CHỈ cho 20/40/60/80/100 (5 mức, không số lẻ)
- Điểm TRUNG BÌNH của toàn batch nên khoảng 50-60, KHÔNG phải 70-80`;
```

### Anchor Examples in Prompt

```typescript
const anchorExamples = `
VÍ DỤ THAM KHẢO (để calibrate điểm):

SP 85 điểm — Nồi chiên không dầu Xiaomi 5.5L, giá 890K, commission 15%:
  market_demand=80, quality_trust=80, viral_potential=100, risk=80
  → Nhu cầu cao, thương hiệu Xiaomi uy tín, dễ demo trước/sau, an toàn

SP 55 điểm — Ốp lưng iPhone silicon, giá 25K, commission 30%:
  market_demand=60, quality_trust=40, viral_potential=40, risk=80
  → Nhu cầu có nhưng cạnh tranh khốc liệt, chất lượng tạm, khó làm video hay, nhưng an toàn

SP 27 điểm — Viên giảm cân thảo dược XYZ, giá 350K, commission 40%:
  market_demand=40, quality_trust=20, viral_potential=20, risk=20
  → aiScore = 40×0.35 + 20×0.25 + 20×0.25 + 20×0.15 = 27 [UPDATED from review — Fix 17: was "25", actual math = 27]
  → Có người tìm nhưng nhạy cảm, không rõ nguồn gốc, khó demo, rủi ro cao bị report
`;
```

### Why 4 criteria instead of 6

Current formula has 6 components (commission, trending, competition, contentFit, price, platform).
But AI doesn't need to evaluate commission/price/competition — we have exact data for those.

AI should evaluate **what data can't tell us**:
- `market_demand` — Is this product what people want RIGHT NOW? (trending + market timing)
- `quality_trust` — Is this product actually good? (brand, reviews, legitimacy)
- `viral_potential` — Will a video about this be interesting? (visual, emotion, hook)
- `risk` — What could go wrong? (returns, reports, health claims)

### Cross-model Calibration Strategy

1. **Rubric scoring (primary)**: 5 discrete tiers per criterion → models agree more than continuous scoring
2. **Anchor examples**: Same 3 examples in every prompt → AI calibrates to reference points
3. **Mean-centering instruction**: "batch average should be 50-60" → prevents score inflation
4. **Post-processing validation**: If batch mean > 70 or < 40, flag as uncalibrated

```typescript
// Post-processing in scoring.ts
function validateBatchScores(scores: ClaudeScoreItem[]): ClaudeScoreItem[] {
  const mean = scores.reduce((s, p) => s + p.aiScore, 0) / scores.length;

  if (mean > 70 || mean < 40) {
    console.warn(`[AI Scoring] Batch mean ${mean.toFixed(1)} outside expected range 40-70`);
    // Don't adjust — just log warning. The global normalization in Phase 01 handles drift.
  }

  // Validate rubric adherence: each sub-score should be 20/40/60/80/100
  for (const item of scores) {
    for (const [key, val] of Object.entries(item.scores || {})) {
      if (![20, 40, 60, 80, 100].includes(val)) {
        // Round to nearest valid tier
        const tiers = [20, 40, 60, 80, 100];
        item.scores[key] = tiers.reduce((a, b) => Math.abs(b - val) < Math.abs(a - val) ? b : a);
      }
    }
    // Recompute aiScore from corrected sub-scores
    const s = item.scores;
    item.aiScore = Math.round(
      s.market_demand * 0.35 + s.quality_trust * 0.25 +
      s.viral_potential * 0.25 + s.risk * 0.15
    );
  }

  return scores;
}
```

### Token Efficiency

Current prompt sends full product JSON (all fields) — wasteful.
New prompt sends only fields AI needs for qualitative judgment:

```typescript
function buildProductContext(products: ProductModel[]): string {
  return JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    commissionRate: p.commissionRate,
    sales7d: p.sales7d,
    totalKOL: p.totalKOL,
    shopRating: p.shopRating,
    platform: p.platform,
    // EXCLUDE: salesTotal, kolOrderRate, etc. — formula handles these
  })));
}
```

Estimated token savings: ~30-40% per batch (remove redundant fields).

### Two-pass scoring? NO.
- Token cost doubles for marginal consistency gain
- Rubric + anchors already provide strong calibration
- Global normalization (Phase 01) handles residual drift

## Case 6: Model Tracking (user switches AI model)

### Problem
User switches Gemini → Claude in Settings. New SP scored by Claude, old SP by Gemini.
Sigmoid absorbs most drift, but user doesn't know which model scored which SP.

### scoringVersion Format [UPDATED from review — Fix 12]

Define explicit version string format to track old vs new scoring:

```typescript
// Version format: "v{major}.{minor}-{feature}-{YYYYMMDD}"
// Examples:
//   "v1.0-holistic-20260301"   — old holistic prompt
//   "v2.0-rubric-20260315"     — new rubric-anchored prompt (this redesign)
//   "v2.1-rubric-20260401"     — minor rubric adjustment
//
// Stored in: Product.scoringVersion field (String?)
// Also in: scoreBreakdown JSON as { ..., scoringVersion: "v2.0-rubric-20260315" }
//
// Usage: filter/query products by scoring version for comparison/audit
const CURRENT_SCORING_VERSION = "v2.0-rubric-20260315"; // Update on each scoring change
```

### Solution: Store model name in scoreBreakdown

```typescript
// lib/ai/scoring.ts — in mergeWithBaseScore()

return {
  aiScore: Math.min(100, Math.max(0, finalScore)),
  scoreBreakdown: JSON.stringify({
    ...claudeItem.scoreBreakdown,
    scoredByModel: modelName,   // e.g., "gemini-2.0-flash", "claude-sonnet-4-6"
    scoredAt: new Date().toISOString(),
  }),
  contentSuggestion: claudeItem.contentSuggestion,
  platformAdvice: claudeItem.platformAdvice,
  scoringVersion: CURRENT_SCORING_VERSION, // [UPDATED from review — Fix 12] use defined version constant
};
```

### Where to get model name
```typescript
// lib/ai/call-ai.ts — return model name from callAI()

interface AIResponse {
  text: string;
  model: string;   // Add: actual model used
  tokens: number;
}
```

### UI display
- Inbox table: small tooltip on score cell → "Scored by Gemini Flash, 2026-03-05"
- NOT a prominent display — subtle indicator only
- No badge, no icon — just tooltip on hover

### Re-score behavior on model switch
- Default: NO auto re-score (sigmoid absorbs drift)
- Optional: Manual button "Re-score tất cả bằng model mới"
  - Shows warning: "Sẽ tốn ~X token (~$Y). Tiếp tục?"
  - Calls existing `/api/internal/rescore-identities` but with `includeAlreadyScored: true`
  - Only scores SP that have `scoredByModel != currentModel` to avoid waste

```typescript
// app/api/internal/rescore-model-switch/route.ts

export async function POST(request: Request): Promise<NextResponse> {
  const { targetModel } = await request.json();

  // Find products scored by a different model
  const products = await prisma.product.findMany({
    where: {
      aiScore: { not: null },
      scoreBreakdown: { not: { path: ["scoredByModel"], equals: targetModel } },
    },
    select: { id: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ message: "All products already scored by " + targetModel, rescored: 0 });
  }

  // Estimate cost before proceeding
  const estimatedTokens = products.length * 150; // ~150 tokens per product
  const estimatedCost = estimatedTokens * 0.000003; // rough $/token

  // Actually re-score
  await scoreProducts({ productIds: products.map(p => p.id), includeAlreadyScored: true });

  return NextResponse.json({
    rescored: products.length,
    estimatedTokens,
    estimatedCost: "$" + estimatedCost.toFixed(2),
  });
}
```

## Files to modify
- MODIFY: `lib/ai/prompts.ts` — rewrite `buildScoringPrompt()`
- MODIFY: `lib/ai/scoring.ts` — add `validateBatchScores()`, store model name, update parser
- MODIFY: `lib/ai/call-ai.ts` — return model name from `callAI()`
- CREATE: `app/api/internal/rescore-model-switch/route.ts` — manual model re-score
- MODIFY: `components/inbox/inbox-table.tsx` — tooltip showing scored-by model

## Rollback Plan [UPDATED from review — Fix 14]

AI prompt change is high-risk: new rubric format differs from old holistic scoring. If new prompt degrades quality, reverting requires re-scoring.

### Rollback strategy:
1. **Keep old prompt as backup**: Save current `buildScoringPrompt()` as `buildScoringPromptV1()` in same file, commented out but preservable.
2. **Deploy Phase 02 separately**: Do NOT bundle with formula changes. Deploy prompt change alone so rollback is isolated.
3. **Test on small batch first**: Before full deployment, score 10-20 products with new prompt and compare:
   - Mean score in expected 45-65 range?
   - Sub-scores adhere to rubric tiers (20/40/60/80/100)?
   - Obvious outliers (known good products scoring <30 or known bad scoring >80)?
4. **Rollback trigger**: If batch mean >75 or <35, or >30% of sub-scores are non-tier values, revert to V1 prompt.
5. **If rollback needed**: Revert `buildScoringPrompt()` → re-score affected batch via `/api/internal/rescore-ai`.

### Deploy order:
```
Day 1: Deploy Phase 02 (prompt only) → test 10-20 products → verify
Day 2: If OK → deploy Phase 01+03 (formula + normalization)
Day 3: Phase 05 (combined formula) + Phase 08 (migration)
```

## Success Criteria
- AI scoring mean per batch: 45-65 (not 70+)
- Sub-score rubric adherence: >90% of values are exactly 20/40/60/80/100
- Cross-model: Switch from Claude to Gemini → mean shift < 5 points
- Token usage: 30%+ reduction per scoring batch
- Model name stored for every scored product
- Tooltip shows model + date on inbox score column
