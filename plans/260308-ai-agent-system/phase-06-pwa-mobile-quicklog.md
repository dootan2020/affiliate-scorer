# Phase 6: PWA Support + Mobile Quick-Log UX

## Context Links
- Parent: [plan.md](plan.md)
- Depends on: None (independent, can run anytime)
- Brainstorm: [report](../260308-ai-agent-system-brainstorm/report.md) Q4

## Overview
- **Date:** 2026-03-08
- **Priority:** P3
- **Effort:** 1h
- **Status:** Pending
- **Description:** Add PWA manifest + service worker registration to make PASTR installable on mobile home screen. Add floating action button (FAB) on mobile for quick access to `/log`. The app is already responsive — PWA just adds installability + home screen icon.

## Key Insights
- No PWA currently: no manifest.json, no service worker
- App already fully responsive — mobile layout works
- PWA makes it installable: home screen icon, standalone display, splash screen
- Quick-log is the primary mobile use case (log results while reviewing TikTok)
- FAB button on mobile bottom-right for instant `/log` access
- `next-pwa` package or manual service worker both work; manual is simpler for our needs

## Requirements

### Functional
- F1: `public/manifest.json` with app name, icons, theme color, display: standalone
- F2: Service worker registration in layout.tsx
- F3: Apple meta tags for iOS PWA support
- F4: App icon (use existing favicon or generate from emoji)
- F5: Floating action button on mobile for quick-log access

### Non-Functional
- NF1: Lighthouse PWA score >= 80
- NF2: No runtime performance impact
- NF3: Works offline for cached pages (stretch goal)

## Architecture

### PWA Files
```
public/
  manifest.json          # PWA manifest
  icons/
    icon-192.png         # Required PWA icon
    icon-512.png         # Required PWA icon
    apple-touch-icon.png # iOS home screen
  sw.js                  # Minimal service worker (cache-first for static assets)
```

### FAB Component
```
Mobile only (< md breakpoint):
  Fixed bottom-right button
  |-> Opens /log page
  |-> Icon: clipboard/plus
  |-> Style: bg-blue-600 rounded-full shadow-lg w-14 h-14
```

## Related Code Files

### Files to Create
- `public/manifest.json`
- `public/sw.js` — Minimal service worker
- `public/icons/icon-192.png` — PWA icon (generated)
- `public/icons/icon-512.png` — PWA icon (generated)
- `components/shared/mobile-fab.tsx` — Floating action button (<40 lines)

### Files to Modify
- `app/layout.tsx` — Add manifest link, Apple meta tags, SW registration script
- `app/page.tsx` or layout — Include MobileFab component

## Implementation Steps

### Step 1: Create PWA Manifest (10 min)

1. Create `public/manifest.json`:
   ```json
   {
     "name": "PASTR - TikTok Affiliate Tool",
     "short_name": "PASTR",
     "description": "AI-powered TikTok affiliate video production",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#f9fafb",
     "theme_color": "#2563eb",
     "orientation": "portrait-primary",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```

### Step 2: Generate Icons (10 min)

1. Use existing app icon or generate via `app/icon.tsx` (Next.js ImageResponse)
2. Create simple icons with "P" letter + blue background
3. Save as `public/icons/icon-192.png` and `public/icons/icon-512.png`

### Step 3: Create Service Worker (10 min)

1. Create `public/sw.js`:
   ```javascript
   // Minimal service worker for PWA installability
   self.addEventListener('install', (e) => { self.skipWaiting(); });
   self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
   self.addEventListener('fetch', (e) => {
     // Network-first for API, cache-first for static
     if (e.request.url.includes('/api/')) return;
     e.respondWith(
       caches.match(e.request).then(r => r || fetch(e.request))
     );
   });
   ```

### Step 4: Update Layout (10 min)

1. Open `app/layout.tsx`
2. Add to `<head>`:
   ```html
   <link rel="manifest" href="/manifest.json" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="default" />
   <meta name="apple-mobile-web-app-title" content="PASTR" />
   <link rel="apple-touch-icon" href="/icons/icon-192.png" />
   <meta name="theme-color" content="#2563eb" />
   ```
3. Add SW registration script (inline or via component):
   ```typescript
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```

### Step 5: Create Mobile FAB (10 min)

1. Create `components/shared/mobile-fab.tsx`:
   ```typescript
   "use client";
   import Link from "next/link";
   import { ClipboardPlus } from "lucide-react";

   export function MobileFab(): JSX.Element {
     return (
       <Link
         href="/log"
         className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all md:hidden"
         aria-label="Log ket qua nhanh"
       >
         <ClipboardPlus className="h-6 w-6" />
       </Link>
     );
   }
   ```
2. Add `<MobileFab />` to root layout or main content area

### Step 6: Verify (10 min)

1. Run `pnpm build`
2. Check Lighthouse PWA audit
3. Verify installability on mobile Chrome/Safari

## Todo List
- [ ] Create public/manifest.json
- [ ] Generate PWA icons (192 + 512)
- [ ] Create public/sw.js
- [ ] Add manifest + Apple meta tags to layout.tsx
- [ ] Add SW registration
- [ ] Create components/shared/mobile-fab.tsx
- [ ] Add MobileFab to layout
- [ ] Build check passes
- [ ] Lighthouse PWA check

## Success Criteria
- App installable on Android Chrome and iOS Safari
- Home screen icon shows "PASTR" with correct icon
- Opens in standalone mode (no browser chrome)
- Mobile FAB visible on mobile, hidden on desktop
- No performance regression
- `pnpm build` passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Service worker caching stale content | Low | Network-first for API; minimal caching |
| FAB overlapping mobile bottom nav | Low | Position above nav bar (bottom-20) |
| iOS PWA limitations (no push notifications) | Low | Not needed for current scope |

## Security Considerations
- Service worker only caches static assets, not API responses
- No sensitive data cached
- SW scope limited to app origin

## Next Steps
- Add push notifications when morning brief is ready (future)
- Offline support for viewing cached briefs (future)
- Share target API: receive shared TikTok URLs directly (complement Telegram bot)

## Unresolved Questions
1. Should FAB position account for existing mobile bottom tab bar? (Need to check current mobile nav height)
2. Should we use `next-pwa` package for more robust caching, or keep it minimal?
