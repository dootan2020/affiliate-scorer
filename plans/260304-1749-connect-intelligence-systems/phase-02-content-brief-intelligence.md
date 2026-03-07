# Phase 2: Content Brief Intelligence

## Context Links

- Content Brief Generator: `lib/content/generate-brief.ts`
- Batch Brief Route: `app/api/briefs/batch/route.ts`
- Explore/Exploit: `lib/learning/explore-exploit.ts`
- CalendarEvent model: Prisma schema (`CalendarEvent`)
- BriefOptions interface: `lib/content/generate-brief.ts` line 23-33

## Overview

- **Priority:** P1
- **Status:** ✅ Complete
- **Review Status:** ✅ Reviewed
- **Effort:** 2h
- **Description:** Two sub-tasks: (2a) inject upcoming CalendarEvents into brief prompt for timing-aware content, (2b) inject explore/exploit hook and format selections into brief generation.

## Key Insights

- `BriefOptions` interface currently has: channel, contentType, videoFormat, targetDuration, characterBible, formatTemplate, videoBible. Missing: calendarEvents, selectedHooks, selectedFormats.
- `buildBriefPrompt()` builds the prompt string — we add new blocks for calendar and explore/exploit.
- `batch/route.ts` is the main caller — it fetches channel, bible, format template. We add CalendarEvent fetch and explore/exploit calls here.
- `selectHooksForBrief(0.3, channelId)` returns `HookTemplate[]` — 70% proven, 30% explore.
- `selectFormatsForBrief(3, channelId)` returns `FormatTemplate[]` — 2 exploit + 1 explore.

## Requirements

<!-- Updated: Validation Session 1 - Calendar window changed from 14 to 7 days per task spec -->
### Functional — 2a: Calendar Injection
- Add `calendarEvents?: CalendarEvent[]` to `BriefOptions`
- In `batch/route.ts`, fetch upcoming events (next 7 days) before brief generation
- In `buildBriefPrompt()`, render calendar block: event name, date, type
- AI uses calendar context to suggest timing-relevant content angles

### Functional — 2b: Explore/Exploit Injection
- Add `suggestedHooks?: HookTemplate[]` and `suggestedFormats?: FormatTemplate[]` to `BriefOptions`
- In `batch/route.ts`, call `selectHooksForBrief()` and `selectFormatsForBrief()` before generating
- In `buildBriefPrompt()`, render suggested hooks/formats block
- AI SHOULD use the suggested hooks/formats but CAN deviate if product context demands

### Non-functional
- Calendar query is lightweight (~1 indexed query)
- Explore/exploit queries already exist, just need to be called
- Backward compatible: both blocks optional, skipped if data is null/empty

## Architecture

```
batch/route.ts
  ├── fetch channel, bible, format template  (existing)
  ├── fetch calendarEvents (next 7 days)    (NEW)
  ├── call selectHooksForBrief(0.3, channelId) (NEW)
  ├── call selectFormatsForBrief(3, channelId) (NEW)
  └── generateBrief(product, briefOptions)   (existing)
        └── buildBriefPrompt()
              ├── channelBlock       (existing)
              ├── calendarBlock      (NEW)
              ├── exploreExploitBlock (NEW)
              ├── contentTypeBlock   (existing)
              └── ...rest            (existing)
```

## Related Code Files

| File | Action |
|------|--------|
| `lib/content/generate-brief.ts` | MODIFY — extend BriefOptions, add blocks to buildBriefPrompt |
| `app/api/briefs/batch/route.ts` | MODIFY — fetch calendar events + call explore/exploit |

## Implementation Steps

### Step 1: Extend BriefOptions interface (generate-brief.ts, line 23)

```typescript
export interface BriefOptions {
  channel?: ChannelContext | null;
  contentType?: string | null;
  videoFormat?: string | null;
  targetDuration?: number | null;
  characterBible?: CharacterBibleData | null;
  formatTemplate?: FormatTemplateData | null;
  videoBible?: Record<string, unknown> | null;
  bibleVersion?: number | null;
  videoBibleVersion?: number | null;
  // NEW
  calendarEvents?: Array<{ name: string; startDate: Date; eventType: string }> | null;
  suggestedHooks?: Array<{ type: string; label: string; description: string }> | null;
  suggestedFormats?: Array<{ id: string; name: string; description: string }> | null;
}
```

### Step 2: Add calendarBlock to buildBriefPrompt (generate-brief.ts, after videoBibleBlock ~line 208)

```typescript
const calendarBlock = options?.calendarEvents && options.calendarEvents.length > 0 ? `
SU KIEN SAP TOI (adapt content theo timing):
${options.calendarEvents.map((e) => {
  const dateStr = new Date(e.startDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  return `- ${e.name} (${e.eventType}) — ngay ${dateStr}`;
}).join("\n")}
→ Nen tao content lien quan den su kien gan nhat neu phu hop voi san pham.
` : "";
```

### Step 3: Add exploreExploitBlock to buildBriefPrompt

```typescript
const exploreExploitBlock = (() => {
  const parts: string[] = [];

  if (options?.suggestedHooks && options.suggestedHooks.length > 0) {
    const proven = options.suggestedHooks.filter((_, i) => i < 7); // first 70% are exploit
    const explore = options.suggestedHooks.filter((_, i) => i >= 7); // last 30% are explore
    parts.push(`HOOKS GOI Y (uu tien dung, co the thay doi neu can):
- Da chung minh: ${proven.map((h) => `"${h.type}"`).join(", ")}
- Kham pha moi: ${explore.map((h) => `"${h.type}"`).join(", ")}`);
  }

  if (options?.suggestedFormats && options.suggestedFormats.length > 0) {
    parts.push(`FORMATS GOI Y:
${options.suggestedFormats.map((f) => `- ${f.name}: ${f.description}`).join("\n")}`);
  }

  return parts.length > 0 ? "\n" + parts.join("\n\n") + "\n" : "";
})();
```

### Step 4: Include new blocks in prompt return (line 210)

```typescript
return `${channelBlock}${characterBlock}${formatBlock}${videoBibleBlock}${calendarBlock}${exploreExploitBlock}${contentTypeBlock}${videoFormatBlock}${durationBlock}
SAN PHAM:
...`;
```

### Step 5: Fetch calendar + explore/exploit in batch/route.ts

After the `[characterBible, formatTemplate, videoBible]` Promise.all (line 53), add:

```typescript
// Fetch calendar events + explore/exploit selections
const [calendarEvents, suggestedHooks, suggestedFormats] = await Promise.all([
  // Validated: 7-day window per task spec (Session 1, Q3)
  prisma.calendarEvent.findMany({
    where: {
      startDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 86_400_000),
      },
    },
    orderBy: { startDate: "asc" },
    take: 5,
    select: { name: true, startDate: true, eventType: true },
  }),
  selectHooksForBrief(0.3, channelId),
  selectFormatsForBrief(3, channelId),
]);
```

### Step 6: Pass to briefOptions (batch/route.ts, line 61)

```typescript
const briefOptions: BriefOptions = {
  // ...existing fields...
  calendarEvents,
  suggestedHooks: suggestedHooks.map((h) => ({
    type: h.type,
    label: h.label,
    description: h.description,
  })),
  suggestedFormats: suggestedFormats.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
  })),
};
```

### Step 7: Add imports to batch/route.ts

```typescript
import { selectHooksForBrief } from "@/lib/learning/explore-exploit";
import { selectFormatsForBrief } from "@/lib/learning/explore-exploit";
```

## Todo List

- [ ] Extend `BriefOptions` with calendarEvents, suggestedHooks, suggestedFormats
- [ ] Add `calendarBlock` builder in `buildBriefPrompt()`
- [ ] Add `exploreExploitBlock` builder in `buildBriefPrompt()`
- [ ] Update prompt template return to include new blocks
- [ ] Fetch CalendarEvents in `batch/route.ts`
- [ ] Call `selectHooksForBrief()` and `selectFormatsForBrief()` in `batch/route.ts`
- [ ] Pass new data into `briefOptions`
- [ ] Add imports for explore-exploit functions
- [ ] Verify compile: `pnpm build`
- [ ] Test: batch brief with calendar events and without

## Success Criteria

- Brief prompt includes calendar events when they exist in next 7 days
- Brief prompt includes suggested hooks/formats from explore/exploit engine
- Brief generates successfully with no calendar events (empty block skipped)
- Brief generates successfully with no learning weights (explore/exploit fallback to random)
- Existing batch brief flow unchanged when new fields not provided
- Build passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Explore/exploit returns empty arrays | Low | buildBriefPrompt skips block if empty |
| HookTemplate/FormatTemplate type mismatch | Medium | Map to simple {type, label, description} shape |
| Prompt too long with all blocks | Low | Calendar capped at 5 events, hooks at 10, formats at 3 |

## Security Considerations

- No new endpoints. Existing auth on batch/route.ts applies.
- Calendar data is user-owned.

## Next Steps

- Phase 3: Smart Content Suggestions API
