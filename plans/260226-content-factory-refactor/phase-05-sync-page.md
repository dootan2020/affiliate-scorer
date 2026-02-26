# Phase 5 — Upload → Sync Page

**Priority:** High
**Status:** ⏳ Pending
**Depends on:** Phase 1 (DB models for TikTok Studio data)
**TASKS.md ref:** Task 4

---

## Overview

Rename /upload → /sync. Two sections:
1. "Nghiên cứu sản phẩm" — Keep existing FastMoss/KaloData upload
2. "TikTok Studio Analytics" — NEW: single dropzone, multi-file, auto-detect by filename

Remove: "Kết quả chiến dịch" (FB/TikTok/Shopee Ads) + "Nhập kết quả thủ công"

---

## TikTok Studio File Types

| Filename Pattern | Columns | Storage | Purpose |
|-----------------|---------|---------|---------|
| Content.xlsx | Time, Video title, Video link, Post time, Total likes/comments/shares/views | → auto-match ContentAsset by video link → fill AssetMetric | Auto-populate video performance |
| Overview.xlsx | Date, Video Views, Profile Views, Likes, Comments, Shares | → AccountDailyStat | Account-level daily stats |
| FollowerActivity.xlsx | Date, Hour, Active followers (168 rows = 24h × 7days) | → FollowerActivity | Best posting time AI input |
| Viewers.xlsx | Various audience data | → AccountInsight type="viewers" | Audience insights |
| FollowerHistory.xlsx | Date, Followers count | → AccountInsight type="follower_history" | Growth tracking |
| FollowerGender.xlsx | Gender, Percentage | → AccountInsight type="follower_gender" | Audience demographics |
| FollowerTopTerritories.xlsx | Territory, Percentage | → AccountInsight type="follower_territories" | Geographic data |

---

## Related Code Files

### Modify
- `app/upload/page.tsx` → Rename to `app/sync/page.tsx` (new route)
- `components/upload/file-dropzone.tsx` → Reuse for both sections

### Create
- `app/sync/page.tsx` — New sync page with 2 sections
- `app/upload/page.tsx` — Redirect to /sync
- `lib/parsers/tiktok-studio-content.ts` — Content.xlsx parser
- `lib/parsers/tiktok-studio-overview.ts` — Overview.xlsx parser
- `lib/parsers/tiktok-studio-follower-activity.ts` — FollowerActivity.xlsx parser
- `lib/parsers/tiktok-studio-insights.ts` — Generic insights parser (viewers, gender, territories, history)
- `lib/parsers/detect-tiktok-studio.ts` — Auto-detect file type by filename
- `app/api/sync/tiktok-studio/route.ts` — POST endpoint for TikTok Studio uploads

### Delete
- `components/upload/campaign-import-zone.tsx` — Campaign import (no longer needed)
- `components/feedback/manual-feedback-form.tsx` — Manual feedback entry
- `components/feedback/feedback-upload.tsx` — Feedback upload
- `lib/parsers/fb-ads.ts` — Facebook Ads parser
- `lib/parsers/campaign-fb-ads.ts` — Campaign FB Ads parser
- `lib/parsers/campaign-tiktok-ads.ts` — Campaign TikTok Ads parser
- `lib/parsers/campaign-shopee-ads.ts` — Campaign Shopee Ads parser
- `lib/parsers/shopee-affiliate.ts` — Shopee affiliate parser
- `app/api/upload/feedback/route.ts` — Feedback upload endpoint

---

## Vietnamese Date Parsing

TikTok Studio exports dates in Vietnamese format:
```
"17 tháng Hai" → February 17
"3 tháng Ba"   → March 3
"25 tháng Một" → January 25
```

Month mapping:
```typescript
const VN_MONTHS: Record<string, number> = {
  'Một': 1, 'Hai': 2, 'Ba': 3, 'Tư': 4, 'Năm': 5, 'Sáu': 6,
  'Bảy': 7, 'Tám': 8, 'Chín': 9, 'Mười': 10, 'Mười Một': 11, 'Mười Hai': 12,
};
```

---

## Implementation Steps

### Section 1: "Nghiên cứu sản phẩm"
1. [ ] Keep existing FastMoss/KaloData dropzone + format detection + column mapping
2. [ ] Move to new `/sync` route
3. [ ] Remove campaign import zone
4. [ ] Remove manual feedback form

### Section 2: "TikTok Studio Analytics"
5. [ ] Create single dropzone that accepts multiple files
6. [ ] On file drop: detect type by filename pattern matching
7. [ ] Show detected file types with status icons
8. [ ] Parse each file type:

   **Content.xlsx parser:**
   9. [ ] Parse columns: Time, Video title, Video link, Post time, Total likes/comments/shares/views
   10. [ ] For each row: match `Video link` against `ContentAsset.videoUrl` or related URLs
   11. [ ] If match found: create/update `AssetMetric` with views/likes/comments/shares
   12. [ ] Handle Vietnamese dates for "Post time"

   **Overview.xlsx parser:**
   13. [ ] Parse columns: Date, Video Views, Profile Views, Likes, Comments, Shares
   14. [ ] Upsert into `AccountDailyStat` (unique by date)

   **FollowerActivity.xlsx parser:**
   15. [ ] Parse 168 rows (24h × 7 days)
   16. [ ] Upsert into `FollowerActivity` (unique by dayOfWeek + hour)

   **Other insight files:**
   17. [ ] Parse and store as `AccountInsight` with appropriate type

### Route + Redirect
18. [ ] Create `app/sync/page.tsx` with both sections
19. [ ] Create `app/upload/page.tsx` redirect → /sync
20. [ ] Create API endpoint `app/api/sync/tiktok-studio/route.ts`

### Cleanup
21. [ ] Delete campaign import components
22. [ ] Delete FB/Shopee Ads parsers
23. [ ] Delete manual feedback entry form

---

## Auto-Match Logic (Content.xlsx)

```typescript
// Match TikTok video link to ContentAsset
async function matchVideoToAsset(videoLink: string) {
  // 1. Direct match on ContentAsset metadata
  const asset = await prisma.contentAsset.findFirst({
    where: {
      OR: [
        { metadata: { path: '$.videoUrl', equals: videoLink } },
        // Also check ContentPost table
      ]
    }
  });

  // 2. Fallback: check ContentPost table
  if (!asset) {
    const post = await prisma.contentPost.findFirst({
      where: { url: { contains: extractVideoId(videoLink) } }
    });
    // ...
  }

  return asset;
}
```

---

## UI Layout

```
┌─────────────────────────────────────────────────┐
│ Sync                                             │
├─────────────────────────────────────────────────┤
│                                                   │
│ 📊 Nghiên cứu sản phẩm                           │
│ ┌─────────────────────────────────────────────┐   │
│ │ Kéo thả file FastMoss/KaloData XLSX         │   │
│ │ [Browse files]                               │   │
│ └─────────────────────────────────────────────┘   │
│ [Format detection card] [Column mapping]           │
│ [Import history table]                             │
│                                                   │
│ 📱 TikTok Studio Analytics                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ Kéo thả nhiều file TikTok Studio cùng lúc   │   │
│ │ (Content.xlsx, Overview.xlsx, v.v.)          │   │
│ │ [Browse files]                               │   │
│ └─────────────────────────────────────────────┘   │
│                                                   │
│ Detected files:                                   │
│ ✅ Content.xlsx — 45 videos → matched 38          │
│ ✅ Overview.xlsx — 30 days data                    │
│ ⏳ FollowerActivity.xlsx — processing...          │
│ ✅ FollowerGender.xlsx — saved                     │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Success Criteria

- [ ] `/sync` page loads with 2 clear sections
- [ ] FastMoss/KaloData upload still works
- [ ] Multi-file TikTok Studio upload works
- [ ] Auto-detect file types by filename
- [ ] Content.xlsx → metrics auto-matched to ContentAssets
- [ ] Overview.xlsx → AccountDailyStat saved
- [ ] FollowerActivity.xlsx → FollowerActivity saved
- [ ] Other insight files → AccountInsight saved
- [ ] Vietnamese date parsing works correctly
- [ ] `/upload` redirects to `/sync`
- [ ] Campaign import removed
- [ ] Manual feedback form removed

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Video link format varies (short vs full URL) | Normalize URLs before matching |
| Vietnamese date edge cases | Test with real TikTok Studio exports |
| Large files (1000+ rows) | Process in chunks, show progress |
