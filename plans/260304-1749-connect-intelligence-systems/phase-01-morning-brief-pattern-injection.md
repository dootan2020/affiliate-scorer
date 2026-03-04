# Phase 1: Morning Brief + Pattern Injection

## Context Links

- Morning Brief: `lib/brief/generate-morning-brief.ts`
- Pattern Detection: `lib/learning/pattern-detection.ts`
- Prisma Model: `UserPattern` (patternType, label, conditions, winRate, avgViews, sampleSize)

## Overview

- **Priority:** P1
- **Status:** ✅ Complete
- **Review Status:** ✅ Reviewed
- **Effort:** 1h
- **Description:** Inject top winning UserPatterns into the morning brief prompt so AI can recommend content strategies based on proven patterns.

## Key Insights

- `generateMorningBrief()` already queries channels, products, calendar events, learning weights, goals. Pattern data is the missing piece.
- `UserPattern` records contain `patternType` (winning/losing), `label`, `conditions` (hook_type, format, category), `winRate`, `avgViews`, `sampleSize`.
- Injection point: after `topWeights` query in the Promise.all block (line 34, 8th parallel query).
- Prompt section: add "WINNING PATTERNS" block after "LEARNING INSIGHTS" section.

## Requirements

### Functional
- Query top 3 winning patterns (patternType="winning", ordered by winRate DESC, sampleSize >= 2)
- Query top 2 losing patterns to warn against
- Inject both into prompt as structured text
- **Cross-reference products with patterns**: For each winning pattern, find scored products whose category matches the pattern's conditions.category → inject product names so AI can say: "Combo hook giá + format before_after win 80% — SP [tên] phù hợp combo này"
- AI should reference patterns + matching products in `tip` field and `produce_today` reasoning

### Non-functional
- Must not increase total query time significantly (single indexed query)
- Graceful fallback: if no patterns exist, show "Chua phat hien pattern"

## Architecture

No new files. Single file modification.

```
generateMorningBrief()
  └── Promise.all([..., winningPatterns, losingPatterns])  // ADD
  └── prompt += "WINNING PATTERNS:\n..."                    // ADD
```

## Related Code Files

| File | Action |
|------|--------|
| `lib/brief/generate-morning-brief.ts` | MODIFY — add pattern queries + prompt section |

## Implementation Steps

### Step 1: Add pattern queries to Promise.all (line 34)

Add two queries to the existing `Promise.all` array:

```typescript
// After upcomingEvents query (line 84-91), add:

// Winning patterns from learning
prisma.userPattern.findMany({
  where: { patternType: "winning", sampleSize: { gte: 2 } },
  orderBy: { winRate: "desc" },
  take: 3,
  select: { label: true, winRate: true, avgViews: true, sampleSize: true, conditions: true },
}),

// Losing patterns to avoid
prisma.userPattern.findMany({
  where: { patternType: "losing", sampleSize: { gte: 2 } },
  orderBy: { winRate: "asc" },
  take: 2,
  select: { label: true, winRate: true, sampleSize: true },
}),
```

### Step 2: Destructure new results

Update the destructuring on line 34:

```typescript
const [newProducts, briefedProducts, yesterdayMetrics, topWeights, currentGoal, activeChannels, upcomingEvents, winningPatterns, losingPatterns] = await Promise.all([...]);
```

### Step 3: Build pattern lines with product cross-references (after eventLines, ~line 135)

```typescript
// Build pattern lines with matching products
const winPatternLines = winningPatterns.map((p) => {
  const cond = p.conditions as Record<string, string>;
  // Cross-reference: find scored products matching this pattern's category
  const matchingProducts = newProducts
    .filter((prod) => cond.category && prod.category?.toLowerCase().includes(cond.category.toLowerCase()))
    .slice(0, 2)
    .map((prod) => prod.title || "?");
  const productNote = matchingProducts.length > 0
    ? ` | SP phu hop: ${matchingProducts.join(", ")}`
    : "";
  return `- ${p.label} | Win rate: ${(p.winRate * 100).toFixed(0)}% | ${p.avgViews} avg views | ${p.sampleSize} videos | Hook: ${cond.hook_type || "?"}, Format: ${cond.format || "?"}${productNote}`;
});

const losePatternLines = losingPatterns.map((p) =>
  `- ${p.label} | Win rate: ${(p.winRate * 100).toFixed(0)}% | ${p.sampleSize} videos`
);
```

> Note: `newProducts` is already fetched in the existing Promise.all. We reuse it for cross-referencing — no extra DB query needed.

### Step 4: Add to prompt (after LEARNING INSIGHTS section, ~line 160)

```typescript
WINNING PATTERNS (đã chứng minh hiệu quả):
${winPatternLines.length > 0 ? winPatternLines.join("\n") : "Chưa phát hiện pattern"}

PATTERNS NÊN TRÁNH:
${losePatternLines.length > 0 ? losePatternLines.join("\n") : "Chưa có"}
```

## Todo List

- [ ] Add `winningPatterns` and `losingPatterns` queries to Promise.all
- [ ] Update destructuring for new query results
- [ ] Build pattern line strings with product cross-references (reuse newProducts)
- [ ] Insert WINNING PATTERNS + PATTERNS NEN TRANH sections into prompt
- [ ] Verify compile: `pnpm build`
- [ ] Test: generate morning brief with and without patterns in DB

## Success Criteria

- Morning brief prompt includes pattern data when UserPattern records exist
- Morning brief generates successfully with 0 patterns (graceful fallback)
- No regression in existing morning brief generation
- Build passes without errors

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| No UserPattern records exist yet | Low | Fallback text "Chua phat hien pattern" |
| Extra DB queries slow down brief gen | Low | Single indexed query, <50ms |

## Security Considerations

- No new endpoints exposed
- Pattern data is user's own data, no cross-tenant risk (single-user app)

## Next Steps

- Phase 2: Content Brief Intelligence (CalendarEvent + Explore/Exploit injection)
