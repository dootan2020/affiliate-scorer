# Phase 3: User Profile Form

## Priority: MEDIUM
## Status: Pending
## Effort: Medium

## Overview
Create a compact profile form (4 questions) that appears when user has no saved profile. Store in localStorage. Provide edit button to re-open.

## Context
- No existing user preferences in the app
- localStorage is fine — single-user tool, no auth needed for this
- Form should be unobtrusive: inline at top of page, not a blocking modal

## Files to Create

### `components/niche-finder/niche-profile-form.tsx`

**Props**:
```typescript
interface Props {
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  compact?: boolean; // true when showing edit summary
}
```

**Layout — Full form** (when no profile):
Horizontal card with 4 fields in a row (desktop) or stacked (mobile).

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Cho tôi biết về bạn để gợi ý ngách phù hợp        │
│                                                         │
│ [Loại nội dung ▼] [Mua SP? ▼] [Mục tiêu ▼] [KN ▼]    │
│                                          [Lưu & Chấm]  │
└─────────────────────────────────────────────────────────┘
```

**Layout — Compact** (when profile exists, show summary + edit):
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Video AI · Không mua SP · 30M/tháng · Mới  [Sửa]  │
└─────────────────────────────────────────────────────────┘
```

**Fields**:

1. **Loại nội dung** — Select
   - "Video AI" → `ai_video`
   - "Quay tay" → `manual`
   - "Cả hai" → `both`

2. **Mua sản phẩm** — Toggle/Select
   - "Có" → `true`
   - "Không" → `false`

3. **Mục tiêu thu nhập** — Select
   - "10M/tháng" → `10_000_000`
   - "30M/tháng" → `30_000_000`
   - "50M+/tháng" → `50_000_000`

4. **Kinh nghiệm** — Select
   - "Mới bắt đầu" → `new`
   - "Có kinh nghiệm" → `experienced`

**localStorage key**: `niche-profile`

**Behavior**:
- On mount: check localStorage → if found, parse + call onSave immediately
- On save: write to localStorage + call onSave
- On edit: expand to full form
- Defaults: `both`, `true`, `30_000_000`, `new`

## Files to Modify

### `components/niche-finder/niche-finder-client.tsx`

Add profile state management:

```typescript
const [profile, setProfile] = useState<UserProfile | null>(null);
const [showProfileForm, setShowProfileForm] = useState(false);

// Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem("niche-profile");
  if (saved) setProfile(JSON.parse(saved));
  else setShowProfileForm(true);
}, []);

// Re-fetch when profile changes
useEffect(() => {
  fetchData(profile);
}, [profile]);
```

Pass profile to API:
```typescript
const url = profile
  ? `/api/niche-finder/summary?profile=${encodeURIComponent(JSON.stringify(profile))}`
  : "/api/niche-finder/summary";
```

Render form above stats bar:
```tsx
<NicheProfileForm
  profile={profile}
  onSave={(p) => { setProfile(p); setShowProfileForm(false); }}
/>
```

## Implementation Steps

1. Create `niche-profile-form.tsx` with full and compact layouts
2. Add localStorage read/write logic
3. Update `niche-finder-client.tsx` to manage profile state
4. Pass profile as query param to API
5. Verify responsive layout (mobile: stacked fields)
6. TypeScript compile check

## Success Criteria
- [ ] First visit shows expanded form
- [ ] Saving stores to localStorage and triggers API refetch
- [ ] Return visit shows compact summary with Edit button
- [ ] Edit button expands form inline
- [ ] Mobile: fields stack vertically
- [ ] Profile passed correctly as API query param
