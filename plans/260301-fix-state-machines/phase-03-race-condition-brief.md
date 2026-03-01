# Phase 3: Race Condition Brief Generation

**Priority:** CRITICAL
**Depends on:** Phase 1
**Issue:** #2
**Status:** Pending

---

## Problem

`generateBrief()` trong `lib/content/generate-brief.ts` (lines 307-396) thực hiện 3 bước KHÔNG atomic:

1. `prisma.contentBrief.create()` — line 317
2. `for loop: prisma.contentAsset.create()` × 3 — lines 335-387
3. `prisma.productIdentity.update({ inboxState: "briefed" })` — line 390

**Race scenarios:**
- 2 tab gọi generate cùng SP → 2 briefs, 6 assets, inconsistent
- Asset creation fails giữa chừng → brief orphan có 1-2 assets thay vì 3
- Rate limit bypass trên regenerate: 2 requests đọc count=2, cả hai pass check (<3)

---

## Solution: Transaction + Idempotency Guard

### Strategy

1. **Check-before-write guard:** Verify inboxState cho phép generate trước khi bắt đầu
2. **Optimistic locking:** Dùng `WHERE` clause với current state khi update inboxState
3. **Transaction cho DB writes:** Wrap brief + assets + inboxState update trong `$transaction`
4. **Separate AI call from DB writes:** AI call (Claude API) chạy ngoài transaction, chỉ DB writes trong transaction

### Implementation

**File:** `lib/content/generate-brief.ts`

```typescript
export async function generateBrief(
  product: ProductInput,
  options?: BriefOptions,
): Promise<string> {
  // ─── STEP 1: Pre-check (outside transaction) ───
  const identity = await prisma.productIdentity.findUnique({
    where: { id: product.id },
    select: { inboxState: true },
  });

  if (!identity) throw new Error("Product identity not found");

  // Guard: only allow from scored (or enriched if skipping enrich)
  const allowedStates = ["scored", "enriched"];
  if (!allowedStates.includes(identity.inboxState)) {
    throw new Error(
      `Cannot generate brief: product is "${identity.inboxState}", expected one of [${allowedStates.join(", ")}]`
    );
  }

  // ─── STEP 2: AI generation (outside transaction — slow, external) ───
  const brief = await callClaudeForBrief(product, options);

  // ─── STEP 3: Atomic DB writes (inside transaction) ───
  const savedBriefId = await prisma.$transaction(async (tx) => {
    // Optimistic lock: re-check state inside transaction
    const current = await tx.productIdentity.findUnique({
      where: { id: product.id },
      select: { inboxState: true },
    });

    if (!current || !allowedStates.includes(current.inboxState)) {
      throw new Error("Product state changed during brief generation (concurrent request?)");
    }

    // Create brief
    const savedBrief = await tx.contentBrief.create({ data: { ... } });

    // Create assets (inside same transaction)
    for (const script of brief.scripts) {
      await tx.contentAsset.create({ data: { briefId: savedBrief.id, ... } });
    }

    // Update inboxState atomically
    const updated = await tx.productIdentity.updateMany({
      where: {
        id: product.id,
        inboxState: { in: allowedStates }, // Optimistic lock
      },
      data: { inboxState: "briefed" },
    });

    if (updated.count === 0) {
      throw new Error("Concurrent brief generation detected — another request already processed this product");
    }

    return savedBrief.id;
  });

  return savedBriefId;
}
```

### AssetCode Generation Inside Transaction

Hiện tại assetCode dùng `count + 1` pattern với retry loop. Trong transaction, thay bằng:

```typescript
// Inside transaction
const todayStart = new Date(); todayStart.setHours(0,0,0,0);
const count = await tx.contentAsset.count({
  where: { createdAt: { gte: todayStart } },
});
const assetCode = `A-${today}-${String(count + 1 + i).padStart(4, "0")}`;
```

Nếu collision → transaction sẽ fail và được retry ở level cao hơn.

### Regenerate Rate Limit Fix

**File:** `app/api/briefs/[id]/regenerate/route.ts`

Chuyển rate limit check VÀO transaction để tránh bypass:

```typescript
const newBriefId = await prisma.$transaction(async (tx) => {
  // Atomic rate limit check
  const todayCount = await tx.contentBrief.count({
    where: {
      productIdentityId: oldBrief.productIdentityId,
      status: { not: "replaced" },
      createdAt: { gte: todayStart },
    },
  });

  if (todayCount >= 3) {
    throw new Error("RATE_LIMIT: Đã đạt giới hạn 3 briefs/ngày");
  }

  // Mark old as replaced
  await tx.contentBrief.update({
    where: { id: oldBriefId },
    data: { status: "replaced" },
  });

  // Generate new brief + assets inside transaction
  // ...
});
```

---

## Implementation Steps

- [ ] Refactor `generateBrief()`: separate AI call from DB writes
- [ ] Wrap DB writes (brief + assets + inboxState) in `$transaction`
- [ ] Add optimistic lock check inside transaction (re-verify inboxState)
- [ ] Use `updateMany` with WHERE condition for optimistic locking
- [ ] Fix assetCode generation inside transaction (single count, offset by index)
- [ ] Fix regenerate endpoint: move rate limit check into transaction
- [ ] Add error handling: distinguish "concurrent request" from "other errors"
- [ ] Test: verify 2 concurrent requests → only 1 succeeds, other gets clear error

---

## Files to Modify
- `lib/content/generate-brief.ts` (major refactor)
- `app/api/briefs/[id]/regenerate/route.ts`
- `app/api/briefs/generate/route.ts` (error handling for concurrent)
- `app/api/briefs/batch/route.ts` (error handling for concurrent)

---

## Risk Assessment
- **AI call timeout inside transaction:** MITIGATED — AI call is OUTSIDE transaction
- **Transaction deadlock:** LOW — single product, no cross-product locks
- **AssetCode collision:** MITIGATED — sequential inside transaction
- **Rollback impact:** Assets + brief all rolled back, clean state

---

## Success Criteria
- [ ] 2 concurrent generate requests → 1 success, 1 clear error
- [ ] Brief + all assets + inboxState in single transaction
- [ ] AssetCode never collides
- [ ] Regenerate rate limit cannot be bypassed
- [ ] Partial brief (missing assets) impossible
