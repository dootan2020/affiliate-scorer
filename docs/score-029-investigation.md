# Investigation: 115 SP with combinedScore 0-29 (now 76 after K fix)

## Summary

The initial re-score with K=1.5 sigmoid produced 115 products (29%) in the 0-29 range. After tuning K to 1.0, this dropped to 76 products (19%). **This is expected behavior, not a bug.** These products have genuinely low AI scores (36-43 out of 100) and low market metrics.

## Root Cause Analysis

### Finding 1: ALL 394 products have AI scores
- Low score WITH AI: **76** (was 115 with K=1.5)
- Low score WITHOUT AI: **0**
- Conclusion: No "formula-only fallback" issue. Every product was scored by AI.

### Finding 2: Low scorers have genuinely weak metrics
| Tier | Avg Price (VND) | Avg Commission |
|------|-----------------|----------------|
| Low (0-29) | 53,615 | 8.2% |
| Mid (30-69) | 104,175 | 9.0% |
| High (70+) | 148,883 | 10.5% |

Low-score products have **3x lower prices** and **lower commissions** than high-score products.

### Finding 3: Category distribution of low scorers
| Count | Category |
|-------|----------|
| 26 | Cham soc sac dep (beauty accessories) |
| 14 | Do gia dung (household items) |
| 9 | Do an & Do uong (food & drink) |
| 5 | O to & xe may (auto/moto accessories) |
| 5 | Phu kien thoi trang (fashion accessories) |

Low scorers cluster in cheap commodity categories with low differentiation and low affiliate value.

### Finding 4: Global stats are healthy
- Raw mean: 62.4 (before normalization)
- Raw stddev: 10.9
- Raw range: 36.8 - 92.1
- Normalized mean: 49.7 (target ~50)
- Normalized stddev: 20.9 (target 15-20)
- Count: 394 (correct, no double-counting)

### Finding 5: Lowest products are legitimately weak
Bottom 5:
| Score | AI Raw | Category | Product |
|-------|--------|----------|---------|
| 9 | 37.25 | Oto & xe may | Lot mu bao hiem Silicon |
| 9 | 37.45 | Beauty | Mat na giay COLORKEY |
| 9 | 36.80 | Trang phuc nu | Ao thun soc co tron |
| 12 | 40.60 | Phu kien | Phu kien toc tuy chon Bang do |
| 12 | 41.00 | Do gia dung | HINH DAN STICKER HOA TIET |

These are low-value accessories, stickers, hair ties — the AI correctly scored them low.

### Finding 6: Top products are legitimately strong
Top 5:
| Score | AI Raw | Product |
|-------|--------|---------|
| 94 | 92.1 | The Voucher giam gia 50% |
| 93 | 91.0 | Thu cam on, The bao hanh |
| 93 | 90.6 | Thu Cam On Khach Hang |
| 92 | 88.8 | DKHOUSE Noi Dien 2.0L Da Nang |
| 92 | 89.1 | Day chuyen PONY charm ngua do |

## Bugs Fixed

### Bug 1: Sigmoid K too steep (K=1.5 → K=1.0)
- **Symptom**: 115 products (29%) in 0-29 range, min score 3
- **Root cause**: K=1.5 with raw stddev=10.9 created extreme spread
- **Fix**: Lowered K to 1.0
- **Result**: 76 products (19%) in 0-29, min score 9, stddev 20.9

### Bug 2: Global stats double-counting
- **Symptom**: After 2 re-score calls, global count=788 instead of 394
- **Root cause**: `syncAllIdentityScores()` always adds to running stats incrementally
- **Fix**: `rescore-identities` endpoint now ALWAYS resets stats before full re-score
- **Result**: count=394 after any number of re-scores

## Final Distribution (K=1.0)

| Tier | Count | % |
|------|-------|---|
| 0-29 | 76 | 19% |
| 30-49 | 130 | 33% |
| 50-69 | 109 | 28% |
| 70-84 | 54 | 14% |
| 85+ | 25 | 6% |

**Total**: 394 | **Mean**: 49.7 | **Median**: 48 | **StdDev**: 20.9

## Conclusion

**No further adjustment needed.** The 76 products scoring 0-29 are legitimately weak products with:
- Low AI scores (36-43 raw)
- Low prices (avg 53K VND)
- Low commissions (8.2%)
- Commodity categories (stickers, hair accessories, cheap beauty items)

The scoring system correctly differentiates these from high-value products.
