# Phase 5: Win Predictor Agent

## Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-schema-nightly-learning.md) (ChannelMemory), [Phase 3](phase-03-content-analyzer.md) (better data quality)
- Brainstorm: [report](../260308-ai-agent-system-brainstorm/report.md) Section 2.5

## Overview
- **Date:** 2026-03-08
- **Priority:** P3
- **Effort:** 1.5h
- **Status:** Pending
- **Description:** Formula-based prediction of order probability for a (product, channel) pair. NO AI calls — pure DB computation from LearningWeightP4 + ChannelMemory. Outputs win probability 0-100% with confidence level. Activates only when channel has >= 10 logged videos.

## Key Insights
- Too little data for ML — formula-based is more reliable and debuggable
- Uses existing `getWeights(channelId)` from `update-weights.ts` for per-channel weights
- 6 features: category match, price range match, hook availability, format fit, trending bonus, commission incentive
- Output: `sigmoid(weighted_sum) * 100` for probability
- Confidence = f(sample count) — more data = higher confidence
- Cost: $0 — no AI calls, pure computation
- Min threshold: 10 logged videos per channel (below = "insufficient data")

## Requirements

### Functional
- F1: Predict win probability for (productId, channelId) pair
- F2: Return probability (0-100), confidence (low/medium/high), reasoning breakdown
- F3: Feature scoring: category, price range, hook, format, trending, commission
- F4: Minimum 10 logged videos required; return "insufficient data" below threshold
- F5: API endpoint for on-demand prediction
- F6: Optionally store prediction on ContentAsset/ContentBrief

### Non-Functional
- NF1: Computation < 200ms (all DB queries, no AI)
- NF2: Agent file under 150 lines
- NF3: No external dependencies

## Architecture

### Win Score Formula
```
Win Score = sum(feature_weight * feature_match)

Features:
1. Category Match (weight 3.0)
   - Channel's avgReward for this product category vs global avg
   - Match = channel_category_reward / global_avg (capped at 2.0)

2. Price Range Match (weight 2.0)
   - Map price to range: <100K, 100-300K, 300K-1M, >1M
   - Channel's avgReward for this price range
   - Match = range_reward / global_avg (capped at 2.0)

3. Hook Availability (weight 2.0)
   - Does channel have winning hooks (winRate >= 50%) for any hookType?
   - Match = best_hook_winRate (0-1)

4. Format Fit (weight 1.5)
   - Channel's top format avgReward
   - Match = top_format_reward / global_avg (capped at 2.0)

5. Trending Bonus (weight 1.0)
   - Product lifecycle: rising/hot = 1.0, new = 0.7, stable = 0.5, declining = 0.2
   - Match = lifecycle_score

6. Commission Incentive (weight 0.5)
   - Higher commission = more affiliate effort
   - Match = min(commissionRate / 15, 1.0) (15% = max expected)

Probability = sigmoid(Win Score - threshold) * 100
Confidence = min(totalVideos / 30, 1.0) mapped to low/medium/high
```

### Data Flow
```
(productId, channelId)
  |-> Query LearningWeightP4 for channelId (category, price_range scopes)
  |-> Query ChannelMemory (winningCombos, totalVideos)
  |-> Query ProductIdentity (category, price, commissionRate, lifecycleStage)
  |-> Compute 6 feature scores
  |-> Weighted sum -> sigmoid -> probability
  |-> Return { probability, confidence, features[] }
```

## Related Code Files

### Files to Create
- `lib/agents/win-predictor.ts` — Prediction logic (<150 lines)
- `app/api/agents/predict-win/route.ts` — API endpoint (<50 lines)

### Files to Modify
- None (self-contained module)

## Implementation Steps

### Step 1: Create Win Predictor Agent (60 min)

1. Create `lib/agents/win-predictor.ts`
2. Export interfaces:
   ```typescript
   interface PredictionFeature {
     name: string;
     weight: number;
     score: number;      // 0-1 match score
     contribution: number; // weight * score
     reasoning: string;   // Vietnamese explanation
   }

   interface WinPrediction {
     probability: number;       // 0-100
     confidence: "low" | "medium" | "high";
     features: PredictionFeature[];
     totalVideosAnalyzed: number;
     message: string;           // Vietnamese summary
   }
   ```
3. Export `predictWin(productId: string, channelId: string): Promise<WinPrediction>`
4. Implementation:
   a. Query ProductIdentity: category, price, commissionRate, lifecycleStage
   b. Query ChannelMemory for channelId — if not found or totalVideos < 10:
      ```typescript
      return {
        probability: 50, confidence: "low",
        features: [], totalVideosAnalyzed: 0,
        message: "Chua du du lieu. Can toi thieu 10 video da log."
      };
      ```
   c. Query LearningWeightP4 where channelId, scope = "category", key = product.category
   d. Query global avgReward for normalization
   e. Map price to range string, query price_range weights
   f. Compute each feature score (see formula above)
   g. Weighted sum, apply sigmoid: `1 / (1 + Math.exp(-(score - 5)))` (threshold = 5)
   h. Map confidence: totalVideos < 15 = "low", < 30 = "medium", >= 30 = "high"
   i. Build Vietnamese reasoning per feature
   j. Return WinPrediction

5. Helper: `mapPriceToRange(price: number): string`
   - `< 100000` -> "under_100k"
   - `100000-300000` -> "100k_300k"
   - `300000-1000000` -> "300k_1m"
   - `> 1000000` -> "over_1m"

### Step 2: Create API Endpoint (20 min)

1. Create `app/api/agents/predict-win/route.ts`
2. POST handler with Zod validation:
   ```typescript
   const schema = z.object({
     productId: z.string().min(1),
     channelId: z.string().min(1),
   });
   ```
3. Call `predictWin(productId, channelId)`
4. Return prediction result

### Step 3: Verify & Test (30 min)

1. Run `pnpm build`
2. Test with channel that has ChannelMemory — verify prediction output
3. Test with channel below threshold — verify "insufficient data" response
4. Test with missing product — verify error handling

## Todo List
- [ ] Create lib/agents/win-predictor.ts
- [ ] Implement 6-feature scoring formula
- [ ] Create app/api/agents/predict-win/route.ts
- [ ] Handle insufficient data case
- [ ] Build check passes
- [ ] Test prediction output
- [ ] Test edge cases (no data, missing product)

## Success Criteria
- Prediction returns probability 0-100 with feature breakdown
- Channels below 10 videos return "insufficient data"
- No AI calls — pure DB computation
- Response time < 200ms
- `pnpm build` passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Formula weights need tuning | Medium | Log predictions vs actuals; adjust weights over time |
| Insufficient data for most channels initially | Low | Expected; formula activates gradually as users log more |
| Category/price mismatch (product has unknown category) | Low | Default to 0.5 match score for unknown features |

## Security Considerations
- API endpoint should validate user access to requested channel
- No sensitive data exposed in prediction response

## Next Steps
- After 100+ logged videos, can train simple logistic regression on actual outcomes
- UI integration: show prediction badge on product detail or before brief creation
- Store predictions on ContentBrief for later accuracy evaluation

## Unresolved Questions
1. Should prediction be shown in UI immediately, or wait for Phase 6 (PWA)?
2. Sigmoid threshold (5.0) — needs calibration. Should we auto-calibrate from historical data?
3. Should we add a 7th feature: "time of day" match (channel's best posting times)?
