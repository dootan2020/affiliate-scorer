# Product Image Extraction - Quick Summary

## TL;DR

**FastMoss:** ❌ No API, not viable.
**TikTok Shop:** ✅ Viable via Playwright browser automation.
**Recommendation:** Next.js endpoint using Playwright + Apify fallback.

---

## Key Findings

### TikTok Shop CDN URL Pattern
```
https://p[NUM]-oec-[SERVICE]-[REGION].tiktokcdn.com/obj/[PATH]~tplv-[FORMAT]:[W]:[H].[EXT]?x-expires=[TS]&x-signature=[SIG]
```

**Examples:**
```
p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/c5e4394...~tplv-noop.image?x-expires=1657852284&x-signature=e/MfI...

p16-oec-ttp.tiktokcdn.com/obj/hash~tplv-photomode-zoomcover:960:960.jpeg?x-expires=1657852284&x-signature=...
```

**Format Options:**
- `~tplv-noop.image` = original quality
- `~tplv-[format]:[WIDTH]:[HEIGHT].jpeg` = custom dimensions
- `~tplv-[format]:[WIDTH]:[HEIGHT].avif` = AVIF format
- `~tplv-[format]:[WIDTH]:[HEIGHT].webp` = WebP format

### Image Extraction Methods

| Method | Viability | Speed | Cost | Detection |
|--------|-----------|-------|------|-----------|
| **Playwright** | ✅ YES | Slow (30-60s) | $0 | Medium |
| **Direct HTTP** | ❌ NO | Fast | $0 | Very High |
| **Official API** | ⚠️ Limited | Fast | $0 | None |
| **Apify Service** | ✅ YES | Slow | $$$ | None |

### Anti-Scraping in 2026
- ❌ JavaScript rendering required (no pure HTML parsing)
- ❌ Signed URLs with expiry (can't cache indefinitely)
- ❌ Encrypted headers & behavioral detection
- ❌ Security verification pages for suspicious requests

---

## Implementation Strategy

### Primary: Playwright Browser Automation
**Pros:**
- Free
- Full control
- Handles JS rendering
- No 3rd-party dependencies

**Cons:**
- Slow (30-60s/request)
- Detectable (IP bans possible)
- Memory overhead
- URL signatures expire

### Fallback: Apify TikTok Shop Scraper
**Pros:**
- Handles anti-scraping automatically
- Reliable (battle-tested)
- Faster than Playwright

**Cons:**
- Paid ($0.10-1.00/product)
- Third-party dependency

### Code Pattern
```typescript
// app/api/product-images/route.ts
try {
  const images = await extractWithPlaywright(productId);
  return Response.json({ images, source: 'playwright' });
} catch (error) {
  // Fallback to Apify
  const images = await extractWithApify(productId);
  return Response.json({ images, source: 'apify' });
}
```

---

## URL Signature Implications

**Critical:** URLs are signed + have expiry timestamps
- ❌ Cannot cache URLs long-term
- ❌ Cannot forge new signatures
- ❌ Must re-fetch images regularly
- ⚠️ TTL unknown (likely 7-30 days)

**Solution:** Cache with TTL matching URL expiry, or always fetch fresh.

---

## FastMoss Status

- ❌ No public product image API
- ❌ Analytics platform only (50M+ products data)
- ❌ No reverse-engineered endpoints found
- ❌ **NOT a viable image source**

---

## High-Resolution Image Access

✅ **Possible via CDN URL manipulation:**
```
// High-res (original)
https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-noop.image

// 1920x1920 JPEG
https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-[format]:1920:1920.jpeg

// 4000x4000 AVIF (if supported)
https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-[format]:4000:4000.avif
```

**Note:** Original dimensions/max resolution not documented. Max practical is likely ~2000x2000.

---

## Rate Limiting

| Source | Limits |
|--------|--------|
| **Direct HTTP** | 5-10 req/min from same IP |
| **Playwright** | Slower, mimics human (30s+) |
| **Official API** | Quota-based (varies) |
| **Apify** | Included in service |

---

## Official APIs

### 1. TikTok Research API
- Requires: Developer account + approval
- Returns: product_id, name, price, ratings, sold count
- **No explicit image field**

### 2. TikTok Partner API
- Requires: Business/seller account
- Returns: Full product data including image URLs
- Format: `{ url_list: [...], height: 1000, width: 1000 }`

---

## Next Steps

1. **Build Playwright endpoint** in `app/api/product-images/route.ts`
2. **Add Apify fallback** for reliability
3. **Implement caching** with TTL logic
4. **Monitor** for detection (IP bans, CAPTCHAs)
5. **Consider official API** for production scale

---

## Files

- **Full Report:** `plans/20260227-product-image-gallery-extraction-research.md`
- **This Summary:** `plans/20260227-product-image-gallery-extraction-research-SUMMARY.md`

---

**Sources:** TikTok Developers, Partner Center, Apify, ScrapeCreators, research.aimultiple.com, scrapfly.io
