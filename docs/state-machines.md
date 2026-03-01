# State Machines — PASTR

Sơ đồ state machine cho toàn bộ thành phần có trạng thái trong dự án.

> **Validation Engine:** Mọi state transition PHẢI đi qua `validateTransition()` hoặc `assertTransition()` từ `lib/state-machines/transitions.ts`. File này là single source of truth cho allowed transitions.

---

## 1. Inbox Pipeline (ProductIdentity.inboxState)

> Luồng chính của sản phẩm từ khi paste link đến xuất bản.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> new : Paste link / Import CSV

    new --> enriched : PUT /api/inbox/[id]\n(thêm metadata)
    new --> scored : syncProductIdentity()\n(import có aiScore)

    enriched --> scored : syncSingleIdentityScore()\n/ score-all

    scored --> briefed : generateBrief()\n(tạo ContentBrief + Assets)

    briefed --> published : Manual update\nPUT /api/inbox/[id]

    published --> archived : Manual update\nPUT /api/inbox/[id]

    new --> archived : Manual archive
    enriched --> archived : Manual archive
    scored --> archived : Manual archive
    briefed --> archived : Manual archive

    state new {
        [*] : Sản phẩm mới paste vào
    }
    state scored {
        [*] : AI đã chấm điểm
    }
    state briefed {
        [*] : Đã tạo brief nội dung
    }
```

**Trigger files:**
- `lib/inbox/process-inbox-item.ts` → tạo `new`
- `lib/services/score-identity.ts` → `new/enriched` → `scored`
- `lib/content/generate-brief.ts` → `scored` → `briefed` (atomic `$transaction` + optimistic lock)
- `app/api/inbox/[id]/route.ts` → manual transitions (validated)

---

## 2. Content Asset (ContentAsset.status)

> Vòng đời của mỗi video asset từ draft đến logged.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> draft : generateBrief() tạo asset

    draft --> produced : User đánh dấu\nPATCH /api/assets/[id]
    produced --> rendered : User đánh dấu\nPATCH /api/assets/[id]
    rendered --> published : User đánh dấu\nPATCH /api/assets/[id]
    published --> logged : POST /api/log/quick\n/ POST /api/log/batch

    published --> produced : Re-produce\n(quay lại sản xuất)

    draft --> failed : Lỗi sản xuất
    draft --> archived : Bỏ qua asset
    produced --> archived : Bỏ qua
    rendered --> archived : Bỏ qua
    published --> archived : Bỏ qua

    failed --> draft : Retry\n(reset complianceStatus)

    note right of logged
        Terminal state.
        Re-capture metrics allowed
        (delta reward update).
        trigger: updateLearningWeights()
        trigger: analyzeAsset() (win/loss)
    end note
```

**Retry logic:** Khi `failed → draft`, `complianceStatus` reset về `"unchecked"` và `complianceNotes` xóa.

**Batch auto-completion:** Khi asset thay đổi status, `checkBatchCompletion()` tự kiểm tra nếu tất cả assets trong batch đã terminal → chuyển batch sang `done`/`failed`.

**Slot sync** — khi asset thay đổi status, ContentSlot tự đồng bộ qua `syncSlotStatusFromAsset()`:

| Asset status | → Slot status |
|---|---|
| `draft` | `planned` |
| `produced` | `produced` |
| `rendered` | `rendered` |
| `published` | `published` |
| `archived` | `skipped` |
| `logged` | `published` |
| `failed` | `skipped` |

> TODO v2: Thêm `manualOverride` flag để user skip slot không bị sync ghi đè.

---

## 3. Content Brief (ContentBrief.status)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> generated : generateBrief()

    generated --> reviewed : User review
    reviewed --> exported : Export batch

    generated --> replaced : POST /api/briefs/[id]/regenerate\n(max 3/ngày/SP)
    reviewed --> replaced : Regenerate

    replaced --> [*] : Brief cũ, không dùng nữa

    note right of generated
        Brief "active" khi:
        status != replaced AND
        ≥1 asset chưa published/archived
    end note
```

**Race condition protection:** `generateBrief()` tách AI call (bên ngoài) khỏi DB writes (atomic `$transaction`). Optimistic lock qua `updateMany` WHERE clause ngăn 2 brief tạo cùng lúc.

**Orphan cleanup:** Khi brief bị `replaced`, tất cả assets ở `draft` của brief cũ tự archive (atomic transaction).

---

## 4. Content Slot (ContentSlot.status)

> Lịch sản xuất nội dung theo kênh.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> planned : POST /api/calendar/slots

    planned --> briefed : Gắn brief vào slot
    briefed --> produced : Asset chuyển produced
    produced --> rendered : Asset chuyển rendered
    rendered --> published : Asset chuyển published

    planned --> skipped : Bỏ qua slot
    briefed --> skipped : Bỏ qua
    produced --> skipped : Bỏ qua
    rendered --> skipped : Bỏ qua

    skipped --> planned : Mở lại slot

    note right of rendered
        Tự động sync từ
        ContentAsset.status
        via syncSlotStatusFromAsset()
    end note
```

---

## 5. Data Import (DataImport.status)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> pending : Upload file

    pending --> processing : process-import.ts bắt đầu

    processing --> completed : Parse + merge thành công 100%
    processing --> partial : Một số dòng lỗi
    processing --> failed : Exception / lỗi nghiêm trọng
```

**Partial clarification:** Khi `partial`, các dòng thành công ĐÃ được commit. Chỉ dòng lỗi bị skip.

---

## 6. Campaign (Campaign.status)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> planning : Tạo campaign

    planning --> creating_content : Bắt đầu sản xuất
    creating_content --> running : Chiến dịch chạy
    running --> paused : Tạm dừng
    paused --> running : Tiếp tục

    running --> completed : Kết thúc
    paused --> completed : Kết thúc từ paused
    paused --> cancelled : Hủy từ paused

    planning --> cancelled : Hủy bỏ
    creating_content --> cancelled : Hủy bỏ
    running --> cancelled : Hủy bỏ

    note right of completed
        verdict: profitable
        | break_even | loss
    end note
```

---

## 7. Commission (Commission.status)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> pending : POST /api/commissions\n(default pending)

    pending --> confirmed : PATCH /api/commissions/[id]\nUser approve
    pending --> rejected : PATCH /api/commissions/[id]\nUser reject

    confirmed --> paid : Đã thanh toán\n(auto receivedDate)
    confirmed --> rejected : Từ chối

    note left of pending
        autoConfirm: true →
        skip pending,
        tạo thẳng confirmed
    end note
```

---

## 8. Production Batch (ProductionBatch.status)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> active : POST /api/production/create-batch

    active --> done : Tất cả assets terminal\n(auto via checkBatchCompletion)
    active --> failed : Tất cả assets failed/archived
    active --> cancelled : PATCH /api/production/[batchId]\nManual cancel

    note right of active
        Export 3 format:
        scripts.md | prompts.json | checklist.csv
    end note
```

**Auto-completion:** `checkBatchCompletion()` chạy sau mỗi asset status change. Nếu tất cả assets đã terminal:
- Tất cả `failed`/`archived` → batch `failed`
- Có ít nhất 1 non-failed → batch `done`

---

## 9. TikTok Channel (TikTokChannel.isActive)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> active : Tạo kênh mới

    active --> inactive : PUT /api/channels/[id]\nisActive: false

    inactive --> active : PUT /api/channels/[id]\nisActive: true

    note right of inactive
        Khi inactive:
        - Không tạo brief được
        - Không tạo content slot
        - API trả lỗi "Kênh đã tạm dừng"
    end note
```

---

## 10. InboxItem (InboxItem.status) — One-shot Classification

> Kết quả phân loại khi paste link. Có retry cho failed items.

```mermaid
stateDiagram-v2
    direction TB

    [*] --> pending : Paste link vào inbox

    pending --> new_product : Tạo ProductIdentity mới
    pending --> duplicate : Trùng identity có sẵn
    pending --> matched : Video/Shop link (không tạo SP)
    pending --> failed : Link không nhận diện được

    failed --> pending : POST /api/inbox/items/[id]/retry\nRe-parse & re-process
```

---

## 11. Learning Loop — Continuous Flow (không phải discrete states)

```mermaid
stateDiagram-v2
    direction LR

    state "Capture Metrics" as capture
    state "Calculate Reward" as reward
    state "Update Weights" as weights
    state "Apply Decay" as decay

    [*] --> capture : POST /api/log/quick\n/ /api/metrics/capture

    capture --> reward : calculateReward()\nviews×1 + likes×2 + ...

    reward --> weights : updateLearningWeights()\nrunning avg + log-bonus

    weights --> decay : POST /api/learning\napplyDecay()

    decay --> weights : Daily decay\n0.5^(days/halfLife)

    note right of reward
        Win/Loss analysis:
        reward > avg×1.5 → "win"
        reward < avg×0.5 → "loss"
        else → "neutral"
    end note
```

**Per-channel weights:** `LearningWeightP4` giờ có `channelId`. Dual-write: mỗi metric update ghi cả channel-specific (`channelId: "chn_xxx"`) VÀ global (`channelId: ""`). Query dùng `channelId: { in: [channelId, ""] }` rồi dedupe (channel wins over global).

**Re-capture:** Asset đã `logged` vẫn nhận thêm `AssetMetric`. Learning weights update bằng delta reward (`newReward - previousReward`), chỉ khi `|delta| > 0.01`.

---

## 12. Product Lifecycle (ProductIdentity.lifecycleStage) — Computed

> Không phải state machine — tính toán từ snapshot data.

```mermaid
stateDiagram-v2
    direction TB

    state "unknown" as unk
    state "new" as n
    state "rising" as r
    state "hot" as h
    state "peak" as p
    state "declining" as d
    state "dead" as dead

    [*] --> unk : < 2 snapshots

    unk --> n : salesTotal < 1000
    unk --> r : salesChange > 50%\nkolChange < 30%
    unk --> h : salesChange > 20%\nkolChange > 50%
    unk --> p : salesChange ±10%
    unk --> d : salesChange < -20%
    unk --> dead : salesChange < -50%

    n --> r : Sales tăng
    r --> h : KOL tăng mạnh
    h --> p : Ổn định
    p --> d : Sales giảm
    d --> dead : Giảm sâu

    note right of h
        Computed bởi
        getProductLifecycle()
        từ ProductSnapshot diffs.
        Auto-recalc sau product import.
    end note
```

**Auto-refresh:** Lifecycle tự recalculate sau khi scoring hoàn tất trong product import (`app/api/upload/products/route.ts`).

---

## 13. DeltaType (ProductIdentity.deltaType) — Classification

> Phân loại mỗi lần import mới.

```mermaid
stateDiagram-v2
    direction TB

    [*] --> NEW : SP mới hoàn toàn
    [*] --> SURGE : Sales/KOL tăng đột biến
    [*] --> COOL : Đã hot, giờ giảm
    [*] --> STABLE : Không thay đổi đáng kể
    [*] --> REAPPEAR : Đã biến mất, xuất hiện lại
```

---

## Compliance Status (ContentAsset.complianceStatus) — One-shot

```mermaid
stateDiagram-v2
    direction LR

    [*] --> unchecked : Asset mới tạo

    unchecked --> passed : checkCompliance() OK
    unchecked --> warning : Có cảnh báo nhẹ
    unchecked --> blocked : Vi phạm nghiêm trọng
```

**Reset:** Khi asset `failed → draft` (retry), `complianceStatus` reset về `unchecked`.

---

## Tổng quan — Luồng chính End-to-End

```mermaid
flowchart LR
    A[Paste Link] --> B[InboxItem\npending → classified]
    B --> C[ProductIdentity\nnew]
    C --> D{Enrich?}
    D -->|Có| E[enriched]
    D -->|Bỏ qua| F[Score]
    E --> F
    F --> G[scored]
    G --> H[Generate Brief]
    H --> I[ContentBrief\ngenerated]
    I --> J[ContentAssets\ndraft ×N]
    J --> K[Production\nproduced → rendered]
    K --> L[Publish\npublished]
    L --> M[Log Metrics\nlogged]
    M --> N[Learning Loop\nupdate weights]
    N --> O[Daily Decay\napplyDecay]

    G --> |briefed| G2[inboxState = briefed]

    subgraph Calendar
        P[ContentSlot\nplanned] --> Q[briefed] --> R[produced] --> R2[rendered] --> S[published]
    end

    J -.->|sync| P

    style A fill:#f97316,color:#fff
    style G fill:#22c55e,color:#fff
    style I fill:#3b82f6,color:#fff
    style L fill:#8b5cf6,color:#fff
    style M fill:#ef4444,color:#fff
    style N fill:#eab308,color:#000
```

---

## Tham chiếu nhanh

| Model | Field | States | Loại |
|---|---|---|---|
| ProductIdentity | `inboxState` | new → enriched → scored → briefed → published → archived | Progression |
| ContentAsset | `status` | draft → produced → rendered → published → logged; failed ↔ draft; published → produced | Progression |
| ContentAsset | `complianceStatus` | unchecked → passed / warning / blocked (reset on retry) | One-shot |
| ContentBrief | `status` | generated → reviewed → exported / replaced | Progression |
| ContentSlot | `status` | planned → briefed → produced → rendered → published / skipped; skipped → planned | Synced from Asset |
| DataImport | `status` | pending → processing → completed / partial / failed | Progression |
| Campaign | `status` | planning → creating_content → running ↔ paused → completed / cancelled | Progression |
| Commission | `status` | pending → confirmed → paid / rejected | Progression |
| ProductionBatch | `status` | active → done / failed / cancelled | Auto-completion |
| TikTokChannel | `isActive` | true / false | Boolean toggle |
| InboxItem | `status` | pending → new_product / duplicate / matched / failed; failed → pending | One-shot + retry |
| ProductIdentity | `lifecycleStage` | new / rising / hot / peak / declining / dead / unknown | Computed |
| ProductIdentity | `deltaType` | NEW / SURGE / COOL / STABLE / REAPPEAR | Classification |
| LearningWeightP4 | weight/avgReward | Continuous numeric, per-channel + global | Continuous |

---

## Validation Engine

Tất cả state transitions được validate centrally:

```typescript
import { validateTransition, assertTransition } from "@/lib/state-machines/transitions";

// API routes — return 400 on invalid
const check = validateTransition("assetStatus", current, next);
if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });

// Service functions — throw on invalid
assertTransition("inboxState", current, next);
```

Source of truth: `lib/state-machines/transitions.ts`
