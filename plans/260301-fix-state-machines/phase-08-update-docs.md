# Phase 8: Update docs/state-machines.md

**Priority:** Required (after all phases)
**Depends on:** All phases completed
**Status:** Pending

---

## Changes to Document

After all fixes are implemented, update `docs/state-machines.md` to reflect:

### 1. Inbox Pipeline (#1)
- Add `briefed → archived` transition
- Add note about `generateBrief()` transaction protection

### 2. Content Asset (#2)
- Add `published → archived` transition
- Add `published → produced` transition (unpublish)
- Add `failed → draft` transition (retry)

### 3. Content Brief (#9)
- Add note: replaced brief's draft assets auto-archived

### 4. Content Slot (#6, #12)
- Add `rendered` status between `produced` and `published`
- Add `skipped → planned` transition
- Update slot sync mapping table

### 5. DataImport (#8)
- Add `failed → pending` transition (retry)
- Add clarification: partial = successful rows committed, failed rows skipped

### 6. Campaign (#7)
- Add `paused → cancelled` transition

### 7. Commission (#11)
- Add `pending` state back (remove note about skipping it)

### 8. ProductionBatch (#4)
- Add `failed` and `cancelled` status
- Add auto-completion logic description

### 9. Learning Loop (#1)
- Add per-channel dimension
- Note global + channel-specific dual weight system

### 10. Tham chiếu nhanh table
- Update all state lists to include new transitions

---

## Success Criteria
- [ ] docs/state-machines.md reflects all implemented changes
- [ ] All mermaid diagrams updated
- [ ] Tham chiếu nhanh table accurate
