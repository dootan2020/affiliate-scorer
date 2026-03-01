# Phase 7: Commission Pending State

**Priority:** LOW
**Depends on:** Phase 1
**Issue:** #11
**Status:** Pending

---

## Problem

Commission tạo thẳng `confirmed`, bỏ qua `pending`. Không có bước review trước khi confirm.

**Current schema:** `status String @default("pending")` — schema ĐÃ có default "pending", nhưng docs/code nói tạo thẳng confirmed.

---

## Solution

Schema đã support `pending`. Chỉ cần:

1. **Verify API creates with `pending`** (not overriding to `confirmed`)
2. **Add transition UI** cho user approve `pending → confirmed`
3. **Phase 1 state machine** đã define: `pending → confirmed → paid/rejected`

### Check Commission API

**File:** `app/api/commissions/route.ts`

Nếu POST handler set `status: "confirmed"`:
```typescript
// BEFORE
data: { status: "confirmed", ... }

// AFTER — respect schema default
data: { ...body }  // status defaults to "pending" from schema
```

Nếu user muốn giữ behavior cũ (tạo thẳng confirmed cho manual entry), thêm option:
```typescript
data: {
  status: body.autoConfirm ? "confirmed" : "pending",
  ...
}
```

### Transition endpoint

```typescript
// PATCH /api/commissions/[id]
assertTransition("commissionStatus", commission.status, body.status);
await prisma.commission.update({
  where: { id },
  data: { status: body.status },
});
```

---

## Implementation Steps

- [ ] Verify commission POST route respects schema default ("pending")
- [ ] Add PATCH handler for status transitions
- [ ] Apply assertTransition validation
- [ ] Compile check

---

## Files to Modify
- `app/api/commissions/route.ts` (POST handler)
- `app/api/commissions/[id]/route.ts` (PATCH handler — create if needed)

---

## Success Criteria
- [ ] New commissions start as `pending`
- [ ] User can confirm/reject via PATCH
- [ ] Invalid transitions return 400 error
