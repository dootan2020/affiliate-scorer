# Phase 1: State Transition Validation Engine

**Priority:** Foundation (blocks all other phases)
**Status:** Pending
**Estimated files:** 2 new, ~15 modified

---

## Context

Hiện tại KHÔNG có validation nào trước khi chuyển state. Mọi API route đều `update({ data: { status: newValue } })` trực tiếp. Kết quả: bất kỳ ai cũng có thể set status bất kỳ giá trị nào, phá vỡ state machine.

**Research findings:**
- `app/api/assets/[id]/route.ts` PATCH: nhận `status` bất kỳ, không validate
- `app/api/inbox/[id]/route.ts` PUT: chỉ check `inboxState === "new"` → `enriched`, còn lại không
- `lib/content/generate-brief.ts`: set `inboxState: "briefed"` không check current state
- `app/api/log/quick/route.ts`: set `status: "logged"` không check current state

---

## Architecture

Tạo 1 file central: `lib/state-machines/transitions.ts`

Định nghĩa **allowed transitions** cho mỗi entity type. Cung cấp 2 functions:
1. `validateTransition(entity, from, to)` — returns `{ valid, error? }`
2. `assertTransition(entity, from, to)` — throws nếu invalid

### State Machines Definition

```typescript
// lib/state-machines/transitions.ts

export const STATE_MACHINES = {
  inboxState: {
    new:       ["enriched", "scored", "archived"],
    enriched:  ["scored", "archived"],
    scored:    ["briefed", "archived"],
    briefed:   ["published", "archived"],      // ← NEW: briefed→archived (#3)
    published: ["archived"],
    archived:  [],                              // terminal
  },

  assetStatus: {
    draft:     ["produced", "failed", "archived"],
    produced:  ["rendered", "archived"],
    rendered:  ["published", "archived"],
    published: ["logged", "archived", "produced"],  // ← NEW: published→archived, published→produced (#3)
    logged:    [],                                   // terminal (re-capture via metrics, not state change)
    failed:    ["draft"],                            // ← NEW: failed→draft (#3)
    archived:  [],                                   // terminal
  },

  briefStatus: {
    generated: ["reviewed", "replaced"],
    reviewed:  ["exported", "replaced"],
    exported:  [],
    replaced:  [],                              // terminal
  },

  slotStatus: {
    planned:   ["briefed", "skipped"],
    briefed:   ["produced", "skipped"],
    produced:  ["rendered", "published", "skipped"],  // ← rendered added (#6)
    rendered:  ["published", "skipped"],               // ← NEW status (#6)
    published: [],
    skipped:   ["planned"],                    // ← NEW: skipped→planned (#3)
  },

  importStatus: {
    pending:    ["processing"],
    processing: ["completed", "partial", "failed"],
    completed:  [],
    partial:    [],
    failed:     ["pending"],                   // ← NEW: retry (#8)
  },

  campaignStatus: {
    planning:         ["creating_content", "cancelled"],
    creating_content: ["running", "cancelled"],
    running:          ["paused", "completed", "cancelled"],
    paused:           ["running", "completed", "cancelled"],  // ← NEW: paused→cancelled (#7)
    completed:        [],
    cancelled:        [],
  },

  commissionStatus: {
    pending:   ["confirmed", "rejected"],       // ← NEW: pending state (#11)
    confirmed: ["paid", "rejected"],
    paid:      [],
    rejected:  [],
  },

  batchStatus: {
    active:    ["done", "failed", "cancelled"],  // ← NEW: failed, cancelled (#4)
    done:      [],
    failed:    [],
    cancelled: [],
  },

  inboxItemStatus: {
    pending:     ["new_product", "duplicate", "matched", "failed"],
    new_product: [],
    duplicate:   [],
    matched:     [],
    failed:      ["pending"],                   // ← NEW: retry (#8)
  },
} as const;
```

### Validation Functions

```typescript
export function validateTransition(
  machine: keyof typeof STATE_MACHINES,
  from: string,
  to: string,
): { valid: boolean; error?: string } {
  const states = STATE_MACHINES[machine];
  const allowedNext = states[from as keyof typeof states];

  if (!allowedNext) {
    return { valid: false, error: `Unknown state "${from}" for ${machine}` };
  }

  if (!(allowedNext as readonly string[]).includes(to)) {
    return {
      valid: false,
      error: `Invalid transition: ${machine} "${from}" → "${to}". Allowed: [${(allowedNext as readonly string[]).join(", ")}]`,
    };
  }

  return { valid: true };
}

export function assertTransition(
  machine: keyof typeof STATE_MACHINES,
  from: string,
  to: string,
): void {
  const result = validateTransition(machine, from, to);
  if (!result.valid) {
    throw new Error(result.error);
  }
}
```

---

## Implementation Steps

### Step 1: Create `lib/state-machines/transitions.ts`
- [ ] Define all state machines with allowed transitions (including new transitions from issues #3, #4, #6, #7, #8, #11)
- [ ] Export `validateTransition()` and `assertTransition()`
- [ ] Export `STATE_MACHINES` constant for type inference
- [ ] Export type helpers: `type InboxState = keyof typeof STATE_MACHINES.inboxState`

### Step 2: Integrate into existing API routes (gradual adoption)
Replace raw status updates with validated transitions. Priority order:

- [ ] `app/api/assets/[id]/route.ts` PATCH — add `assertTransition("assetStatus", current, newStatus)` before update
- [ ] `app/api/inbox/[id]/route.ts` PUT — add `assertTransition("inboxState", current, newState)`
- [ ] `lib/content/generate-brief.ts` — add validation before `inboxState: "briefed"`
- [ ] `app/api/log/quick/route.ts` — validate before `status: "logged"`
- [ ] `app/api/log/batch/route.ts` — validate before `status: "logged"`
- [ ] `app/api/calendar/slots/[id]/route.ts` — validate slot status changes
- [ ] `lib/content/sync-slot-status.ts` — validate before bulk update

### Step 3: Error handling pattern
Each route returns appropriate error when transition is invalid:
```typescript
const result = validateTransition("assetStatus", asset.status, newStatus);
if (!result.valid) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

---

## Files to Create
- `lib/state-machines/transitions.ts`

## Files to Modify
- `app/api/assets/[id]/route.ts`
- `app/api/inbox/[id]/route.ts`
- `lib/content/generate-brief.ts`
- `app/api/log/quick/route.ts`
- `app/api/log/batch/route.ts`
- `app/api/calendar/slots/[id]/route.ts`
- `lib/content/sync-slot-status.ts`

---

## Success Criteria
- [ ] All state transitions in codebase go through validation
- [ ] Invalid transitions return 400 with clear error message
- [ ] TypeScript types derived from STATE_MACHINES constant
- [ ] Compile check passes
