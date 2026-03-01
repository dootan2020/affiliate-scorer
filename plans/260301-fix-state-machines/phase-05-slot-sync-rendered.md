# Phase 5: Slot Sync Bidirectional + Rendered Status

**Priority:** HIGH
**Depends on:** Phase 1
**Issues:** #6, #12
**Status:** Pending

---

## Problem

1. **Slot sync is one-directional:** Asset → Slot only. Khi asset `published → produced` (unpublish), slot không quay về.
2. **`rendered` and `produced` map to same slot status:** Calendar không phân biệt được asset đã render xong hay chưa.

**Current mapping** (`lib/content/sync-slot-status.ts`):
```
draft → planned
produced → produced
rendered → produced  ← PROBLEM: same as produced
published → published
archived → skipped
logged → published
```

---

## Solution

### 5a. Add `rendered` status to ContentSlot

**Schema:** ContentSlot.status already is a String field. Thêm "rendered" vào allowed values — không cần migration.

**Updated mapping:**
```
draft → planned
produced → produced
rendered → rendered      ← FIXED: now distinct
published → published
archived → skipped
logged → published
failed → skipped         ← ADD: failed assets skip their slots
```

### 5b. Bidirectional sync

Hiện tại `syncSlotStatusFromAsset()` chỉ chạy khi asset changes. Cần:
- Khi asset goes backward (published → produced), slot cũng goes backward
- Mapping đã cover: `produced → produced` sẽ tự revert slot

**Current code** (`lib/content/sync-slot-status.ts` lines 21-40):
```typescript
const ASSET_TO_SLOT_STATUS: Record<string, string> = {
  draft: "planned",
  produced: "produced",
  rendered: "produced",     // ← Change to "rendered"
  published: "published",
  archived: "skipped",
  logged: "published",
};
```

**Updated code:**
```typescript
const ASSET_TO_SLOT_STATUS: Record<string, string> = {
  draft: "planned",
  produced: "produced",
  rendered: "rendered",     // ← CHANGED
  published: "published",
  archived: "skipped",
  logged: "published",
  failed: "skipped",        // ← ADDED
};
```

This already handles bidirectional because:
- Asset `published → produced` → sync fires → slot gets `produced` (reverted)
- Asset `published → archived` → sync fires → slot gets `skipped`
- Asset `rendered → published` → sync fires → slot gets `published`

### 5c. Update Phase 1 slotStatus state machine

Already included in Phase 1 definition:
```typescript
slotStatus: {
  planned:   ["briefed", "skipped"],
  briefed:   ["produced", "skipped"],
  produced:  ["rendered", "published", "skipped"],
  rendered:  ["published", "skipped"],           // ← NEW
  published: [],
  skipped:   ["planned"],
}
```

### 5d. Validate sync doesn't override manual slot changes

Add guard: only sync if slot is linked to the changed asset.

```typescript
export async function syncSlotStatusFromAsset(
  contentAssetId: string,
  assetStatus: string,
): Promise<number> {
  const slotStatus = ASSET_TO_SLOT_STATUS[assetStatus];
  if (!slotStatus) return 0;

  // Only update slots linked to this specific asset
  const result = await prisma.contentSlot.updateMany({
    where: {
      contentAssetId,
      // Guard: don't override manually-set terminal states
      status: { notIn: ["published"] }, // published slots stay published
    },
    data: { status: slotStatus },
  });

  return result.count;
}
```

Wait — nếu asset goes `published → produced`, slot PHẢI revert. Nên guard nên chỉ block khi slot status KHÁC expected mapping. Actually simplify: just let the mapping override. The sync function maps directly from asset status — nếu asset says "produced", slot says "produced". Đơn giản, predictable.

**Final decision:** Keep sync simple — always override slot status based on asset status. No guards needed since asset is the source of truth.

---

## Implementation Steps

- [ ] Update `ASSET_TO_SLOT_STATUS` mapping: `rendered → "rendered"`, add `failed → "skipped"`
- [ ] Update Phase 1 `slotStatus` state machine to include `rendered`
- [ ] Verify `syncSlotStatusFromAsset()` is called on ALL asset status changes (not just some)
- [ ] Check Calendar UI components handle `rendered` status display
- [ ] Compile check

---

## Files to Modify
- `lib/content/sync-slot-status.ts` (mapping update)
- `lib/state-machines/transitions.ts` (slotStatus includes rendered)
- Calendar UI components displaying slot status (badge colors, labels)

---

## Calendar UI Update

Thêm `rendered` status badge cho Calendar view:

```typescript
// Existing status colors + new rendered
const SLOT_STATUS_CONFIG = {
  planned:   { label: "Đã lên lịch", color: "gray" },
  briefed:   { label: "Đã brief", color: "blue" },
  produced:  { label: "Đã quay", color: "amber" },
  rendered:  { label: "Đã dựng", color: "purple" },   // ← NEW
  published: { label: "Đã đăng", color: "emerald" },
  skipped:   { label: "Bỏ qua", color: "gray" },
};
```

---

## Success Criteria
- [ ] Calendar shows distinct status for `produced` vs `rendered` slots
- [ ] Asset `published → produced` → slot reverts to `produced`
- [ ] Asset `failed` → slot becomes `skipped`
- [ ] Sync fires on every asset status change
