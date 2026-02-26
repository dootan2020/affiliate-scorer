# Phase 2 — Fix /inbox/[id] Routing + All Product.id Links (Tasks 1B+1C+1D)

## Priority: HIGH

## Problem
- `/inbox/[id]` accepts both ProductIdentity.id and Product.id via fallback — inconsistent
- Similar products link uses Product.id
- Multiple components use Product.id for `/inbox/` links

## Solution

### 2A: Fix `/inbox/[id]/page.tsx` routing (Task 1B)
**Current** (line 63-73):
```typescript
const identity = await prisma.productIdentity.findUnique({ where: { id } });
const productId = identity?.product?.id ?? id;  // fallback to Product.id
```

**New logic:**
1. Lookup ProductIdentity by id (include Product)
2. If NOT found → check if id is a Product.id → find linked ProductIdentity → redirect to `/inbox/{identity.id}`
3. If still NOT found → 404

### 2B: Fix similar products links (Task 1C)
**Current** (line 95-111, 414):
```typescript
// Query: prisma.product.findMany(...)  → returns Product.id
// Link: href={`/inbox/${sp.id}`}  → sp.id = Product.id
```

**New:**
- Query similar products WITH identity join
- Link: `href={/inbox/${sp.identityId || sp.identity?.id}}`
- Filter out products without linked ProductIdentity

### 2C: Fix all other Product.id → /inbox links (Task 1D)

Files confirmed using Product.id for /inbox links:
| File | Line | Current |
|------|------|---------|
| `components/products/product-table.tsx` | 173 | `href={/inbox/${product.id}}` |
| `components/products/product-card.tsx` | 34 | `href={/inbox/${product.id}}` |
| `app/shops/[id]/page.tsx` | 206 | `href={/inbox/${product.id}}` |
| `app/inbox/[id]/page.tsx` | 414 | `href={/inbox/${sp.id}}` |

Also check:
- Dashboard Content Suggestions widget
- Dashboard Morning Brief widget
- Production page ProductSelector
- Library page asset cards

## Implementation Steps
1. Fix inbox/[id] routing logic (redirect instead of fallback)
2. Fix similar products query to include identity
3. Fix product-table.tsx, product-card.tsx, shops/[id]/page.tsx
4. Scan remaining components for Product.id links
5. TypeScript compile check
