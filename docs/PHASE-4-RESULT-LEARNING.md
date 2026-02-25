# PHASE 4: RESULT + LEARNING

> Tham chiếu: ROADMAP-FINAL-V2.md
> Goal: Log kết quả → AI học hook/format/angle nào win → scripts ngày càng chính xác.
> Phụ thuộc: Phase 3 (Content Factory) phải xong — cần có assets để log.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — asset_metrics, learning_weights, user_patterns
2. /log page — paste TikTok links (quick + batch)
3. Match link → asset (by post_id hoặc manual)
4. Nhập metrics (views, likes, shares, saves, comments — tay)
5. Reward score calculation
6. Learning weights update (hook/format/angle/category)
7. Decay function (pattern cũ giảm weight)
8. Explore/exploit ratio cho content generation
9. Win/Loss analysis per asset
10. Playbook page (patterns tích lũy)
11. API endpoint cho Chrome extension (tương lai)
```

---

## 1. DATABASE SCHEMA

### Bảng asset_metrics

```sql
CREATE TABLE asset_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_asset_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  
  -- Khi nào capture
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual',     -- "manual" | "extension" | "import"
  
  -- Core metrics (tất cả nullable — nhập bao nhiêu cũng được)
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  
  -- Advanced metrics (extension/import sau)
  avg_watch_time_s DECIMAL(5,2),
  completion_rate DECIMAL(3,2),              -- 0-1
  followers_gained INTEGER,
  
  -- Business metrics (optional)
  clicks INTEGER,                            -- Clicks vào link affiliate
  orders INTEGER,
  commission_amount INTEGER,                 -- VND
  
  -- Computed
  reward_score DECIMAL(8,4) DEFAULT 0,
  
  -- Raw data (nếu import từ CSV/extension)
  raw_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_am_asset ON asset_metrics(content_asset_id);
CREATE INDEX idx_am_captured ON asset_metrics(captured_at DESC);
```

### Bảng learning_weights

```sql
CREATE TABLE learning_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  scope TEXT NOT NULL,                       -- "hook_type" | "format" | "angle" | "category" | "price_range"
  key TEXT NOT NULL,                         -- VD: "result", "review_short", "Phụ kiện"
  
  weight DECIMAL(10,4) DEFAULT 0,
  sample_count INTEGER DEFAULT 0,           -- Bao nhiêu videos đóng góp vào weight này
  avg_reward DECIMAL(8,4) DEFAULT 0,
  
  decay_half_life_days INTEGER DEFAULT 14,  -- Weight giảm 50% sau 14 ngày không có data mới
  last_reward_at TIMESTAMPTZ,               -- Lần cuối có video mới đóng góp
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scope, key)
);

CREATE INDEX idx_lw_scope ON learning_weights(scope);
```

### Bảng user_patterns (playbook)

```sql
CREATE TABLE user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pattern_type TEXT NOT NULL,                -- "winning" | "losing"
  label TEXT NOT NULL,                       -- "Review ngắn + Mỹ phẩm < 200K"
  
  conditions JSONB NOT NULL,
  -- { "hook_type": "result", "format": "review_short", "category": "Mỹ phẩm", "price_range": "0-200K" }
  
  asset_ids JSONB DEFAULT '[]',             -- Asset IDs match pattern
  sample_size INTEGER DEFAULT 0,
  
  avg_views INTEGER,
  avg_reward DECIMAL(8,4),
  win_rate DECIMAL(3,2),                    -- % assets có reward > threshold
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. /log PAGE

### Quick mode (1 video):

```
┌─────────────────────────────────────────────────┐
│ 📊 Log kết quả                                  │
│                                                  │
│ Link TikTok: [paste URL]                        │
│ → Matched: Video 1 — Serum Vitamin C — Review   │
│                                                  │
│ Views:    [12,345]                               │
│ Likes:    [450]     (optional)                   │
│ Comments: [23]      (optional)                   │
│ Shares:   [8]       (optional)                   │
│ Orders:   [3]       (optional)                   │
│                                                  │
│ [Lưu]                                           │
│                                                  │
│ Reward Score: 7.2 ✅                             │
└─────────────────────────────────────────────────┘
```

### Batch mode (nhiều video):

```
┌─────────────────────────────────────────────────┐
│ 📊 Log batch                                    │
│                                                  │
│ Paste nhiều link (1 link/dòng):                 │
│ ┌──────────────────────────────────────────────┐│
│ │ https://tiktok.com/@you/video/123456         ││
│ │ https://tiktok.com/@you/video/123457         ││
│ │ https://tiktok.com/@you/video/123458         ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ [Parse links]                                    │
│                                                  │
│ Kết quả: 3 links                                │
│ ✅ Video 123456 → Serum Vitamin C — Review      │
│ ✅ Video 123457 → Serum Vitamin C — Demo        │
│ ⚠️ Video 123458 → Không match — [Chọn asset ▼] │
│                                                  │
│ Nhập metrics nhanh (views bắt buộc, còn lại bỏ):│
│ Video 1: Views [12,345] Likes [450]             │
│ Video 2: Views [2,100]  Likes [80]              │
│ Video 3: Views [8,700]  Likes [320]             │
│                                                  │
│ [Lưu tất cả]                                    │
└─────────────────────────────────────────────────┘
```

### Match logic:

```typescript
async function matchTikTokLink(url: string): Promise<ContentAsset | null> {
  // Extract post_id từ URL
  const postId = url.match(/video\/(\d+)/)?.[1];
  if (!postId) return null;
  
  // 1. Match by post_id
  const asset = await findAssetByPostId(postId);
  if (asset) return asset;
  
  // 2. Match by published_url
  const assetByUrl = await findAssetByPublishedUrl(url);
  if (assetByUrl) return assetByUrl;
  
  // 3. Không match → return null, user chọn thủ công
  return null;
}
```

---

## 3. REWARD SCORE

### Tính từ metrics:

```typescript
function calculateReward(metrics: AssetMetrics): number {
  let reward = 0;
  
  // Views (log scale — 100K views không gấp 10x giá trị 10K views)
  if (metrics.views) {
    reward += Math.log(1 + metrics.views) * 1.0;
  }
  
  // Engagement (shares + saves quan trọng hơn likes)
  if (metrics.shares) reward += metrics.shares * 0.5;
  if (metrics.saves) reward += metrics.saves * 0.3;
  if (metrics.likes) reward += Math.log(1 + metrics.likes) * 0.3;
  
  // Comments có hỏi link = intent mua
  if (metrics.comments) reward += metrics.comments * 0.2;
  
  // Completion rate (nếu có — từ extension)
  if (metrics.completion_rate) {
    reward += metrics.completion_rate * 5; // 0-1 → 0-5 bonus
  }
  
  // Orders (ultimate metric — weight cao nhất)
  if (metrics.orders) reward += metrics.orders * 10;
  
  // Commission (tiền thật)
  if (metrics.commission_amount) {
    reward += Math.log(1 + metrics.commission_amount / 1000) * 2;
  }
  
  return Math.round(reward * 100) / 100;
}
```

---

## 4. LEARNING WEIGHTS UPDATE

### Khi có reward mới → update weights:

```typescript
async function updateLearningWeights(asset: ContentAsset, reward: number): Promise<void> {
  const updates = [
    { scope: "hook_type", key: asset.hook_type },
    { scope: "format", key: asset.format },
    { scope: "angle", key: asset.angle },
    { scope: "category", key: asset.product.category },
  ].filter(u => u.key); // Bỏ null
  
  for (const { scope, key } of updates) {
    await upsertWeight(scope, key, reward);
  }
}

async function upsertWeight(scope: string, key: string, reward: number): Promise<void> {
  const existing = await findWeight(scope, key);
  
  if (existing) {
    // Running average
    const newCount = existing.sample_count + 1;
    const newAvg = (existing.avg_reward * existing.sample_count + reward) / newCount;
    const newWeight = newAvg * Math.log(1 + newCount); // Weight tăng theo cả quality và quantity
    
    await updateWeight(existing.id, {
      weight: newWeight,
      sample_count: newCount,
      avg_reward: newAvg,
      last_reward_at: new Date(),
    });
  } else {
    await createWeight({
      scope, key,
      weight: reward,
      sample_count: 1,
      avg_reward: reward,
      last_reward_at: new Date(),
    });
  }
}
```

---

## 5. DECAY FUNCTION

### Chạy daily (cron hoặc khi generate brief):

```typescript
async function applyDecay(): Promise<void> {
  const weights = await getAllWeights();
  
  for (const w of weights) {
    if (!w.last_reward_at) continue;
    
    const daysSinceLastReward = daysBetween(w.last_reward_at, new Date());
    const halfLife = w.decay_half_life_days; // Default 14
    
    // Exponential decay: weight *= 0.5^(days/halfLife)
    const decayFactor = Math.pow(0.5, daysSinceLastReward / halfLife);
    const decayedWeight = w.weight * decayFactor;
    
    await updateWeight(w.id, { weight: decayedWeight });
  }
}
```

Ý nghĩa: Hook "result" win 2 tuần trước nhưng không có video mới → weight giảm 50%. Buộc AI thử hook khác.

---

## 6. EXPLORE/EXPLOIT

### Khi generate brief, AI chọn hooks:

```typescript
function selectHooksForBrief(
  allHooks: HookTemplate[],
  weights: LearningWeight[],
  exploreRatio: number = 0.3  // 30% explore
): HookTemplate[] {
  const total = 10; // 10 hooks per brief
  const exploitCount = Math.round(total * (1 - exploreRatio)); // 7
  const exploreCount = total - exploitCount; // 3
  
  // EXPLOIT: top hooks by weight
  const rankedHooks = allHooks
    .map(h => ({
      ...h,
      weight: weights.find(w => w.scope === 'hook_type' && w.key === h.type)?.weight || 0,
    }))
    .sort((a, b) => b.weight - a.weight);
  
  const exploitHooks = rankedHooks.slice(0, exploitCount);
  
  // EXPLORE: random từ hooks chưa test nhiều hoặc mới
  const underTested = allHooks.filter(h => {
    const w = weights.find(w => w.scope === 'hook_type' && w.key === h.type);
    return !w || w.sample_count < 3; // Chưa có hoặc < 3 videos
  });
  
  const exploreHooks = underTested.length >= exploreCount
    ? shuffleAndTake(underTested, exploreCount)
    : shuffleAndTake(allHooks, exploreCount);
  
  return [...exploitHooks, ...exploreHooks];
}
```

---

## 7. WIN/LOSS ANALYSIS

### Khi asset có metrics → auto analyze:

```typescript
async function analyzeAsset(asset: ContentAsset, metrics: AssetMetrics): Promise<Analysis> {
  const avgReward = await getOverallAvgReward();
  const isWin = metrics.reward_score > avgReward * 1.5; // Win = reward > 1.5x average
  const isLoss = metrics.reward_score < avgReward * 0.5;
  
  const factors: Factor[] = [];
  
  // Hook analysis
  const hookAvg = await getAvgRewardByHookType(asset.hook_type);
  factors.push({
    factor: "Hook",
    value: asset.hook_type,
    impact: metrics.reward_score > hookAvg ? "positive" : "negative",
    detail: `Hook "${asset.hook_type}" avg reward: ${hookAvg.toFixed(1)}`,
  });
  
  // Format analysis
  const formatAvg = await getAvgRewardByFormat(asset.format);
  factors.push({
    factor: "Format",
    value: asset.format,
    impact: metrics.reward_score > formatAvg ? "positive" : "negative",
    detail: `Format "${asset.format}" avg reward: ${formatAvg.toFixed(1)}`,
  });
  
  // Category analysis
  const catAvg = await getAvgRewardByCategory(asset.product.category);
  factors.push({
    factor: "Category",
    value: asset.product.category,
    impact: metrics.reward_score > catAvg ? "positive" : "negative",
  });
  
  // Timing
  const hourPosted = asset.published_at?.getHours();
  factors.push({
    factor: "Thời gian đăng",
    value: hourPosted ? `${hourPosted}:00` : "unknown",
    impact: hourPosted && hourPosted >= 19 && hourPosted <= 21 ? "positive" : "neutral",
  });
  
  return {
    asset_id: asset.id,
    verdict: isWin ? "win" : isLoss ? "loss" : "neutral",
    reward: metrics.reward_score,
    factors,
  };
}
```

---

## 8. PLAYBOOK — /insights

### UI:

```
🧠 Playbook (từ 30 videos)

WINNING PATTERNS:
🏆 #1: Hook "result" + Review ngắn + Mỹ phẩm
   Win rate: 80% | Avg views: 25K | 5 videos
   
🏆 #2: Hook "price" + Demo + Phụ kiện < 200K
   Win rate: 67% | Avg views: 18K | 3 videos

LOSING PATTERNS:
❌ #1: Hook "compare" + Điện tử
   Loss rate: 75% | Avg views: 2K | 4 videos

INSIGHTS:
💡 Hook tốt nhất: "result" (review kết quả)
💡 Format tốt nhất: Review ngắn 15-20s
💡 Thời gian tốt nhất: 19:00-21:00
💡 Category mạnh: Mỹ phẩm, Phụ kiện
💡 Category yếu: Điện tử (tránh)
```

---

## 9. EXTENSION API (SẴN SÀNG, CHƯA BUILD EXTENSION)

### Endpoint nhận metrics từ Chrome extension (tương lai):

```typescript
// POST /api/metrics/capture
// Extension gửi payload từ TikTok Studio analytics page

interface ExtensionPayload {
  platform: "tiktok";
  post_id: string;
  post_url: string;
  captured_at: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    avg_watch_time_s?: number;
    completion_rate?: number;
    followers_gained?: number;
  };
}

// Handler: match post_id → asset → save metrics → compute reward
```

Endpoint tồn tại sẵn. Extension build sau khi có 50+ videos cần track.

---

## API ENDPOINTS

```
POST   /api/log/quick              — Log 1 video (link + metrics)
POST   /api/log/batch              — Log nhiều videos
POST   /api/log/match              — Parse links, return matched assets

GET    /api/learning/weights        — Xem learning weights
POST   /api/learning/decay          — Trigger decay (admin)

GET    /api/patterns                — Xem playbook
POST   /api/patterns/regenerate     — Regenerate patterns từ data

POST   /api/metrics/capture         — Extension endpoint (sẵn sàng)
```

---

## TEST CHECKLIST

- [ ] Paste 1 TikTok link → match đúng asset
- [ ] Paste 3 links batch → match đúng, 1 unmatched → manual select
- [ ] Nhập metrics → reward score tính đúng
- [ ] Reward → learning weights update đúng (hook, format, angle, category)
- [ ] Decay: weight giảm theo thời gian
- [ ] Generate brief sau 5+ videos → hooks reflect learning (top hooks ưu tiên)
- [ ] Explore ratio: 30% hooks mới/chưa test
- [ ] Win/Loss analysis hiện khi có metrics
- [ ] Playbook hiện patterns khi có ≥5 videos
- [ ] Extension endpoint nhận payload đúng format
- [ ] Build pass, không lỗi
