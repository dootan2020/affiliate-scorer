# Quick Reference Card: Cross-Batch Score Normalization

**Print this. Keep it handy.**

---

## Problem in One Sentence
Score 80 in batch 1 ≠ score 80 in batch 2 (min-max per-batch normalization breaks cross-batch comparison)

---

## Solution in One Sentence
Use running z-score normalization (Welford's algorithm) to maintain global statistics across ALL products

---

## Why Z-Score?
```
✅ Preserves meaning      (80 always = strong)
✅ Efficient              (O(1) per score)
✅ Production-proven      (TensorFlow uses it)
✅ Easy to implement      (2-3 hours)
✅ No API costs           (free)
```

---

## How It Works (Simple)
```
1. Store global: mean, std dev
2. New score arrives: calculate z = (score - mean) / std
3. Rescale: final = z * 15 + 50 (to 0-100 range)
4. Update global stats with Welford's algorithm
5. Repeat for next score
```

---

## Implementation Phases
```
Phase 1: Database + Normalizer class              (2-3 hours) ← START HERE
Phase 2: Prompt anchoring (multi-model cal)      (1 hour)    ← Next week
Phase 3: Temperature normalization                (4-6 hours) ← Month 2
```

---

## Files to Read (by time budget)

| Time | Read | Outcome |
|------|------|---------|
| 5 min | This card | Understand problem |
| 10 min | SUMMARY.md | Make decision |
| 20 min | + approach-comparison.md | Fully convinced |
| 60 min | + research-report.md | Deep understanding |
| 2 hrs | + implementation-guide.md | Ready to code |

---

## 4 Approaches Compared

| Approach | Preserves Meaning | Effort | Cost | Recommendation |
|----------|-------------------|--------|------|-----------------|
| Z-Score | ✅ | 2-3h | Free | ⭐⭐⭐⭐ |
| Percentile | ❌ | 1h | Free | ⭐⭐ |
| ELO | ❌ | 8-10h | Free | ❌ |
| Bayesian | ⚠️ | 6-8h | Free | ❌ |

**PICK: Z-Score**

---

## Welford's Algorithm (The Math)

For each new score x:
```
count = count + 1
delta = x - mean
mean = mean + delta / count
delta2 = x - mean
M2 = M2 + delta * delta2

variance = M2 / count
std = sqrt(variance)

z_score = (x - mean) / std
final = z_score * 15 + 50
```

---

## Database Change
```sql
CREATE TABLE ScoreNormalizerState (
  id INTEGER PRIMARY KEY,
  count BIGINT,
  mean FLOAT,
  M2 FLOAT
);
```

**3 columns. One row. That's it.**

---

## Code Change Summary
```
lib/ai/scoring.ts → mergeWithBaseScore()

  Add 2 lines:
  await updateRunningStats(rawScore);
  finalScore = await normalizeScore(finalScore);
```

**That's all. Super simple.**

---

## Expected Result
```
BEFORE:
  Batch 1: [45, 92] range (incomparable)
  Batch 2: [20, 80] range (incomparable)

AFTER:
  All: mean=50, std=15 (comparable!)
  Score 80 always means ~strong (consistent!)
```

---

## Timeline

| When | What | Duration |
|------|------|----------|
| Today | Read this card + SUMMARY.md | 15 min |
| Today | Approve approach | 5 min |
| This week | Phase 1 (database + code) | 2-3 hours |
| Next week | Monitor + Phase 2 (prompt anchoring) | 1 hour |
| Month 2 | Phase 3 (multi-model calibration) | 4-6 hours |

---

## Success Checklist

After Phase 1:
- [ ] Database table created
- [ ] Normalizer class written
- [ ] Integration code complete
- [ ] Test suite passes
- [ ] Monitoring endpoint works
- [ ] Cross-batch scores now comparable

---

## Common Questions

**Q: Will this break existing scores?**
A: No. Old scores stay old. New scores use new normalization. After ~1 week (bootstrap), you can optionally re-normalize old ones.

**Q: What if I want to revert?**
A: Delete normalizer logic. Scores stay in DB. Ez rollback.

**Q: How long before stats stabilize?**
A: ~30-50 products (1-2 batches). Full convergence: ~200 products (2 weeks).

**Q: Can we still compare scores to a "good threshold"?**
A: Yes! That's the whole point. "80 = strong" stays consistent.

---

## Key Formulas

**Z-Score:**
```
z = (x - mean) / std
```

**Rescale to 0-100:**
```
final = (z * 15) + 50
```

**Welford's Update:**
```
new_mean = old_mean + (x - old_mean) / n
new_M2 = old_M2 + (x - old_mean) * (x - new_mean)
new_variance = new_M2 / n
```

---

## Production-Grade Notes

- ✅ Used in TensorFlow batch normalization
- ✅ Prevents numerical rounding errors (Welford's)
- ✅ O(1) memory, O(n) per-batch
- ✅ Works with streaming data (incremental updates)
- ✅ No reprocessing needed
- ✅ Easy to monitor & debug

---

## Document Map

```
📍 You are here: QUICK-REFERENCE.md (1 min)

├─ SUMMARY.md (10 min) ← Recommended next
├─ approach-comparison.md (15 min)
├─ research-report.md (30 min)
├─ implementation-guide.md (2 hours)
└─ README.md (overall nav)
```

**Next:** Read SUMMARY.md

---

## Decision Tree

```
Need cross-batch comparable scores?
├─ YES
│  └─ Want to preserve meaning (80 = "strong")?
│     ├─ YES → Use Z-SCORE ⭐
│     └─ NO  → Use PERCENTILE
└─ NO → Keep current approach
```

**For PASTR: Follow tree → Z-SCORE**

---

## Contact / Questions

See SUMMARY.md "Unresolved Questions" section for research gaps.

See implementation-guide.md "Risk Assessment" for mitigation strategies.

---

## TL;DR

1. **Problem:** Cross-batch scores incomparable
2. **Solution:** Running z-score (Welford's algorithm)
3. **Effort:** 2-3 hours Phase 1
4. **Cost:** Free (no API calls)
5. **Gain:** Comparable scores across all batches
6. **Next:** Read SUMMARY.md + approve
7. **Then:** Follow implementation-guide.md

---

**Bookmark this. You'll reference it again.**

Last updated: 2026-03-05
