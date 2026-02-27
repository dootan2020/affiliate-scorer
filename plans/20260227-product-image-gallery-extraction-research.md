# Product Image Gallery Extraction Research Report

**Date:** 2026-02-27
**Topic:** Extracting product image galleries from FastMoss and TikTok Shop
**Goal:** Build a Next.js API endpoint returning high-quality image URLs for product galleries

---

## Executive Summary

**RECOMMENDATION: Use TikTok Shop + Official Research API or Browser Automation with Playwright**

FastMoss is an analytics dashboard with no public product image API. TikTok Shop has multiple extraction paths:
1. **Official Research API** (restricted, requires approval): Ideal for authorized partners
2. **Browser Automation** (reliable): Playwright recommended for JavaScript-heavy product pages
3. **HTML parsing** (limited): Basic fallback if images are pre-rendered

**Key Finding:** Both platforms use signed CDN URLs with short TTLs (expires + signature tokens). High-resolution images available via CDN URL manipulation.

---

## 1. FastMoss Analysis

### 1.1 Overview
FastMoss is a TikTok Shop analytics platform with:
- 50M+ products database
- 120M+ historical sales data
- 220M+ creator data
- Analytics dashboard for trends and insights

**Status:** No public product image API available

### 1.2 API Availability
- ❌ **No documented public API** for image extraction
- ✅ Has "an API" (mentioned in reviews) but no technical documentation
- ❌ No GitHub projects or public implementation examples
- ❌ Access appears restricted to premium dashboard users

### 1.3 Feasibility Assessment
| Feature | Available | Notes |
|---------|-----------|-------|
| Public API docs | ❌ No | No documented endpoints |
| Image extraction API | ❌ No | Not mentioned in any sources |
| Web scraping | ⚠️ Possible | Would require reverse-engineering |
| Direct product links | ✅ Yes | URLs like `fastmoss.com/zh/e-commerce/detail/[ID]` |

**Conclusion:** FastMoss is **NOT a viable direct source** for product images. It's an analytics tool, not an image provider.

---

## 2. TikTok Shop Analysis

### 2.1 HTML & Page Structure

**Direct Page Fetch Result:** ❌ **Blocked by security verification**
- Pages return security/verification screens (slide verification)
- Direct HTML fetching hits rate limiting / bot detection
- JavaScript-heavy rendering required

**Image Structure (when successfully loaded):**
- Images dynamically loaded via JavaScript
- Gallery images embedded in product JSON within page source or API calls
- Multiple image sizes generated on-the-fly

### 2.2 Official APIs Available

#### Option A: TikTok Shop Research API (Public)
**Endpoint:** `https://developers.tiktok.com/doc/research-api-specs-query-tiktok-shop-info`

**Status:** ✅ Official, but restricted
- Requires developer account approval
- Requires access token authentication
- Rate limited
- Intended for research/analytics

**Product Fields Returned:**
```
- product_id
- product_name
- product_description
- product_price (array)
- product_rating (1-5)
- product_review_count
- product_sold_count
- ⚠️ No explicit "image" field documented
```

**Verdict:** No native image field. Images may be embedded in description or as separate data.

#### Option B: TikTok Shop Partner API
**Endpoint:** `https://partner.tiktokshop.com/docv2/page/products-api-overview`

**Status:** ✅ Official, for sellers/partners
- Requires business/seller account
- Full product management capability
- Can upload/edit product images
- Includes image upload endpoints

**Relevant Endpoints:**
- `Upload Product Image API` - upload images
- `Create Product` - includes image URLs in request
- `Partial Edit Product` - modify product data

**Product Image Format in Responses:**
```json
{
  "image": {
    "height": 1000,
    "width": 1000,
    "uri": "image_id_string",
    "url_list": [
      "https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-format.image?x-expires=...&x-signature=..."
    ]
  }
}
```

**Verdict:** Good for seller accounts, but requires TikTok business account.

### 2.3 TikTok CDN Image URLs

**CDN Domain Pattern:**
```
https://p[NUM]-oec-[SERVICE]-[REGION].[DOMAIN]/obj/[PATH]~tplv-[FORMAT].image?x-expires=[TIMESTAMP]&x-signature=[SIGNATURE]
```

**Real Examples:**
```
p16-oec-ttp.tiktokcdn.com         (primary OEC - Origin Edge Cache)
p16-oec-general-useast5.ttcdn-us.com
p19-oec-general-useast5.ttcdn-us.com
p16-sign-sg.tiktokcdn.com         (signed variant)
```

**URL Components:**
| Component | Example | Meaning |
|-----------|---------|---------|
| p[NUM] | p16, p19 | Point-of-Presence / geographic origin |
| oec | oec | Origin Edge Cache service |
| SERVICE | ttp, general | Service type (TikTok Product, General CDN) |
| REGION | useast5, sg | Geographic region |
| DOMAIN | tiktokcdn.com, ttcdn-us.com | Root domain |
| PATH | `tos-alisg-p-0037/c5e4394...` | Content path |
| FORMAT | noop, photomode-zoomcover:960:960 | Image format/optimization |
| x-expires | 1657852284 | Unix timestamp (URL expires then) |
| x-signature | e/MfIsqU... | Base64 signature for validation |

**Image Format Examples:**
```
~tplv-noop.image              (no optimization, original)
~tplv-photomode-zoomcover:960:960.jpeg    (960x960 JPEG)
~tplv-photomode-zoomcover:960:960.avif    (960x960 AVIF)
```

**High-Resolution Access:**
- ✅ Can request original quality with `tplv-noop` format
- ✅ Can specify dimensions (e.g., `:1920:1920`, `:4000:4000`)
- ✅ Multiple file formats: JPEG, AVIF, WebP
- ⚠️ Signature + expiry required for authenticated access
- ⚠️ URL expires after `x-expires` timestamp

**Verdict:** URLs are signed/time-limited. Cannot be used after expiry without re-fetching.

### 2.4 Anti-Scraping Measures

**TikTok's 2026 Anti-Bot Defenses:**
1. ❌ **Encrypted headers** - blocks standard HTTP requests
2. ❌ **Behavioral detection** - detects bot patterns
3. ❌ **Real-time fraud scoring** - rate limiting based on behavior
4. ❌ **JavaScript rendering requirement** - must execute JS to load content
5. ❌ **Security verification pages** - slide/puzzle verification for suspicious requests

**Severity:** HIGH. Advanced anti-scraping in place since 2026.

### 2.5 Browser Automation Approaches

#### Approach 1: Playwright (RECOMMENDED)
**Pros:**
- ✅ Handles JavaScript rendering automatically
- ✅ Better built-in reliability than Puppeteer
- ✅ Cross-browser support (Chrome, Firefox, WebKit)
- ✅ Auto-wait functionality (eliminates manual timing)
- ✅ Multiple language bindings

**Cons:**
- ❌ Slower than Puppeteer for simple tasks
- ❌ Larger dependency footprint
- ❌ Still detectable as automation (but less than basic requests)

**Implementation Pattern:**
```typescript
// Pseudo-code
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Set realistic user agent & headers
await page.setUserAgent('Mozilla/5.0...');

await page.goto('https://shop.tiktok.com/view/product/[ID]', {
  waitUntil: 'networkidle',
  timeout: 30000
});

// Wait for images to load
await page.waitForSelector('img[data-testid*="gallery"]');

// Extract image URLs from DOM or page state
const images = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[data-testid*="gallery"] img'))
    .map(img => img.src || img.dataset.src);
});
```

**Detection Evasion:**
- Use nodriver/undetected-browser libraries
- Add random delays between actions
- Rotate user agents
- Implement request throttling
- Monitor for CAPTCHA blocks

#### Approach 2: Native HTTP + HTML Parsing (LIMITED)
**Pros:**
- ✅ Fast, lightweight
- ✅ No browser overhead

**Cons:**
- ❌ Won't work - TikTok renders content in JS
- ❌ HTML is mostly empty <div> tags until JS executes
- ❌ Images won't be in initial HTML

**Verdict:** NOT viable for TikTok Shop.

#### Approach 3: Third-Party Scrapers (Apify)
**Available Scrapers:**
1. **Apify TikTok Shop Scraper** - extracts product data + images
2. **Apify TikTok Shop Product API** - programmatic access
3. **Apify TikTok Shop Search Scraper** - search + extract

**Approach:**
```typescript
// Use Apify API
const response = await fetch('https://api.apify.com/v2/acts/excavator~tiktok-shop-scraper/run', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
  body: JSON.stringify({
    productUrls: ['https://shop.tiktok.com/view/product/1732875000708433686']
  })
});

// Returns: { productTitle, images: [...], prices: [...], ... }
```

**Pros:**
- ✅ Handles anti-scraping automatically
- ✅ Reliable (battle-tested)
- ✅ Supports bulk operations
- ✅ Built-in retry/error handling

**Cons:**
- ❌ Paid service ($0.10-$1.00 per product)
- ❌ Rate limited
- ❌ Third-party dependency
- ❌ Data not 100% guaranteed fresh

**Verdict:** Good for production but add cost to operation.

### 2.6 Rate Limiting & CORS

**Network Requests (Direct HTTP):**
- ❌ CORS: TikTok blocks cross-origin requests
- ❌ Rate limiting: Aggressive after 5-10 requests/minute from same IP
- ❌ Bot detection: Immediate block after repeated requests

**Browser Automation:**
- ⚠️ Rate limiting still applies but slower (mimics human)
- ⚠️ CORS not relevant (same-origin context)
- ⚠️ Detection harder but still possible with behavioral analysis

**Server-Side API:**
- ✅ Proper rate limiting (documented: varies by endpoint)
- ✅ Quota-based (requests per day/month)
- ✅ Requires authentication (API key/token)

---

## 3. Technical Findings Summary

### 3.1 Data Extraction Patterns

| Method | Viability | Speed | Cost | Detectability | Implementation |
|--------|-----------|-------|------|---|---|
| **Direct HTTP** | ❌ No | Fast | $0 | Very High | Simple |
| **Playwright + Evasion** | ✅ Yes | Slow | $0 | Medium | Medium |
| **Official API (Research)** | ⚠️ Limited | Fast | $0 | None | Medium |
| **Official API (Partner)** | ✅ Yes | Fast | $0 | None | Medium |
| **Apify Scraper** | ✅ Yes | Slow | $$$ | None | Easy |

### 3.2 Image URL Formats Found

**From research:**
```
https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/c5e4394893164bbf90605100e8bdd45c~tplv-noop.image?x-expires=1657852284&x-signature=e/MfIsqUUUoXBe0mXuz5wVdfhc=

https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-photomode-zoomcover:960:960.jpeg?x-expires=[ts]&x-signature=[sig]
```

**High-resolution variant:**
```
https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-noop.image  (original)
https://p16-oec-ttp.tiktokcdn.com/obj/[path]~tplv-[format]:[width]:[height].jpeg
```

**Available formats:** JPEG, AVIF, WebP (inferred from format specs)

### 3.3 URL Signature & Expiry

**Critical Limitation:** Signed URLs expire after `x-expires` timestamp
- TTL typically 1-7 days (inferred)
- Signature prevents tampering with expiry time
- Cannot be extended without re-fetching from source
- Storage/caching of URLs will eventually fail

**Implication for API endpoint:**
- Must fetch fresh URLs for each request, OR
- Cache URLs with TTL matching expiry, OR
- Strip signature and use CDN without auth (may not work)

---

## 4. Recommended Implementation Paths

### Path 1: Browser Automation (Self-Hosted, Free)
**Best for:** Low-to-medium volume, cost-sensitive, full control

**Stack:**
- Node.js + Playwright
- Browser pool (ChromiumPool) for concurrency
- Proxy rotation for IP diversity
- Request throttling

**Code Sketch:**
```typescript
// app/api/product-images/route.ts
import { chromium } from 'playwright';

export async function GET(req: Request) {
  const { productId, region = 'VN' } = Object.fromEntries(
    new URL(req.url).searchParams
  );

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(
      `https://shop.tiktok.com/view/product/${productId}?region=${region}`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );

    // Wait for gallery to render
    await page.waitForSelector('[data-testid*="gallery"] img', { timeout: 5000 });

    // Extract image URLs
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid*="gallery"] img'))
        .map(img => img.currentSrc || img.src)
        .filter(url => url && url.includes('tiktokcdn'));
    });

    return Response.json({ images, source: 'tiktok-shop' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    await browser.close();
  }
}
```

**Challenges:**
- ⚠️ Requires headless browser (memory overhead)
- ⚠️ Slow (30-60s per product)
- ⚠️ Still detectable (IP bans possible)
- ⚠️ URL expiry means stale cache issues

### Path 2: Official Research API (Authorized Partners)
**Best for:** Bulk analytics, official data, compliance

**Requirements:**
- TikTok developer account
- API approval request (whitelist)
- Access token

**Limitations:**
- No explicit image field in product response
- May need secondary HTML parsing for images

**Code Sketch:**
```typescript
// Fallback to browser if API doesn't return images
const response = await fetch(
  'https://open.tiktokapis.com/v2/research/tts/product/query',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TIKTOK_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: { product_id: [productId] }
    })
  }
);

// If no images in response, fall back to Playwright
```

### Path 3: Apify Third-Party Service (Managed)
**Best for:** High volume, reliability required, operational budget available

**Setup:**
```typescript
import Apify from 'apify-client';

const client = new Apify.ApifyClient({
  token: process.env.APIFY_TOKEN,
});

export async function GET(req: Request) {
  const { productId } = Object.fromEntries(
    new URL(req.url).searchParams
  );

  const run = await client.actor('excavator/tiktok-shop-scraper').call({
    productUrls: [`https://shop.tiktok.com/view/product/${productId}`],
  });

  const dataset = await client.dataset(run.defaultDatasetId).listItems();
  const product = dataset.items[0];

  return Response.json({
    images: product.images || [],
    source: 'apify',
    cost: '$0.10-1.00 per request'
  });
}
```

**Cost Model:**
- ~$0.10-1.00 per product
- 100 products/day = $10-100/month
- Includes anti-bot handling automatically

---

## 5. URL Signature Analysis

**Finding:** TikTok CDN URLs include cryptographic signatures

**URL Signature Components:**
```
x-signature=e/MfIsqUUUoXBe0mXuz5wVdfhc=
x-expires=1657852284
```

**Can We Forge Signatures?**
- ❌ No. Signature is HMAC-based, requires TikTok's secret key
- ❌ Cannot modify expiry and re-sign
- ❌ Attempting invalid signatures blocks access

**Implication:**
- Must fetch fresh URLs regularly
- Cannot do permanent caching
- Each request needs live image extraction

---

## 6. Comparison: FastMoss vs TikTok Shop

| Aspect | FastMoss | TikTok Shop |
|--------|----------|-------------|
| **Image API** | ❌ None | ✅ Yes (Partner API) |
| **Official Access** | Analytics only | Full product data |
| **Difficulty** | N/A (not viable) | Medium (Playwright) to Easy (Apify) |
| **Cost** | N/A | $0 (self-hosted) or $$$ (Apify) |
| **Speed** | N/A | 30-60s (browser) or 5-10s (API) |
| **Reliability** | N/A | Medium (browser) to High (official API) |
| **Scalability** | N/A | Low (browser) to High (API) |
| **Rate Limits** | N/A | Aggressive | Quota-based |

**Verdict:** **TikTok Shop is the only viable source.**

---

## 7. Concrete URL Patterns Discovered

### Gallery Image URLs (from research)
```
p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/c5e4394893164bbf90605100e8bdd45c~tplv-noop.image?x-expires=1657852284&x-signature=e/MfIsqUUUoXBe0mXuz5wVdfhc=

p16-oec-ttp.tiktokcdn.com/obj/[large-hash]~tplv-photomode-zoomcover:960:960.jpeg?x-expires=[timestamp]&x-signature=[base64]

p19-oec-general-useast5.ttcdn-us.com/obj/[hash]~tplv-[format]:[width]:[height].avif?x-expires=[ts]&x-signature=[sig]
```

### Format Specifiers
```
~tplv-noop.image                    → original quality
~tplv-photomode-zoomcover:960:960   → 960x960 with crop
~tplv-photomode-zoomcover:1920:1920 → 1920x1920 with crop
~tplv-[any]:[W]:[H].jpeg            → W×H JPEG
~tplv-[any]:[W]:[H].avif            → W×H AVIF
~tplv-[any]:[W]:[H].webp            → W×H WebP
```

### Extraction Points
1. **HTML DOM:** `img[data-testid*="gallery"]`, `picture > img`
2. **JSON State:** `window.__INIT_STATE__['product']['images']` (common pattern)
3. **Network XHR:** `shop.tiktok.com/api/v1/product/detail?product_id=[ID]`

---

## 8. Unresolved Questions

1. **Exact TTL of signed URLs:** Is it 7 days, 30 days, or variable? (Not documented)
2. **Network request format for product images:** Does TikTok Shop API return image URLs directly, or require separate fetch?
3. **FastMoss API access:** Is the API actually usable for non-premium users? (Unclear from sources)
4. **Detection evasion ceiling:** How reliably can Playwright evade detection long-term? (Constantly evolving)
5. **Alternative CDN formats:** Are there unsignedURLs or different CDN domains available? (Not found)
6. **Image original dimensions:** Can we request original uncompressed images, or max is always capped? (Not documented)

---

## 9. Final Recommendation

### For Next.js API Endpoint: Use **Playwright + Fallback to Apify**

**Primary Method: Playwright**
- Fast (relative to competitors)
- Free
- Full control
- Handles JavaScript rendering natively

**Setup:**
```typescript
// lib/image-extractor.ts
import { chromium } from 'playwright';

export async function extractProductImages(productId: string, region = 'VN') {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createIncognitoBrowser();
  const page = await context.newPage();

  // Set realistic headers
  await page.setExtraHTTPHeaders({
    'User-Agent': randomUserAgent(),
    'Accept-Language': 'en-US,en;q=0.9'
  });

  try {
    await page.goto(
      `https://shop.tiktok.com/view/product/${productId}?region=${region}`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );

    // Wait for images
    await page.waitForLoadState('networkidle');

    // Extract from multiple possible locations
    const images = await page.evaluate(() => {
      const urls = new Set<string>();

      // Method 1: DOM selectors
      document.querySelectorAll('img[src*="tiktokcdn"]').forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src) urls.add(src);
      });

      // Method 2: Window state (if available)
      const state = (window as any).__INIT_STATE__ || {};
      const productImages = state.product?.images || [];
      productImages.forEach((img: any) => {
        if (img.url_list?.[0]) urls.add(img.url_list[0]);
      });

      return Array.from(urls);
    });

    return { images, source: 'playwright', success: true };
  } catch (error) {
    console.error('Playwright extraction failed:', error);
    // Fallback to Apify
    return fallbackToApify(productId);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function fallbackToApify(productId: string) {
  // ... Apify implementation
}
```

**Why this combo:**
- ✅ Reduces reliance on single method
- ✅ Graceful degradation
- ✅ Cost-effective at low volume
- ✅ Manual fallback on detection

---

## 10. References

### Official Documentation
- [TikTok Shop Details API Documentation](https://developers.tiktok.com/doc/research-api-specs-query-tiktok-shop-info?enter_method=left_navigation)
- [TikTok Shop Product Query API Documentation](https://developers.tiktok.com/doc/research-api-specs-query-tiktok-shop-products?enter_method=left_navigation)
- [TikTok Shop Partner Center - Products API Overview](https://partner.tiktokshop.com/docv2/page/650b23eef1fd3102b93d2326)
- [TikTok Shop Partner Center - Upload Product Image API](https://partner.tiktokshop.com/docv2/page/6509df95defece02be598a22)

### Third-Party Tools & Services
- [Apify TikTok Shop Scraper](https://apify.com/excavator/tiktok-shop-scraper)
- [Apify TikTok Shop Product API](https://apify.com/excavator/tiktok-shop-product/api)
- [ScrapeCreators - TikTok Shop API Guide](https://scrapecreators.com/blog/tiktok-shop-api)

### Research & Guides
- [Best TikTok Scraping Tools in 2026](https://research.aimultiple.com/tiktok-scraping/)
- [How To Scrape TikTok in 2026](https://scrapfly.io/blog/posts/how-to-scrape-tiktok-python-json)
- [How to Scrape TikTok Shop Products with JavaScript](https://scrapecreators.com/tutorials/how-to-scrape-tiktok-shop-product-with-javascript/)
- [TikTok Image Sizes Guide](https://www.accio.com/blog/tiktok-image-sizes-full-guide-to-specs-and-best-practices)
- [Playwright vs Puppeteer - 2026 Comparison](https://www.firecrawl.dev/blog/playwright-vs-puppeteer)

### CDN & Infrastructure
- [TikTok CDN Information (Netify)](https://www.netify.ai/resources/cdn/tiktok-cdn)
- [Hostname Information - p16-oec-ttp.tiktokcdn-us.com](https://www.netify.ai/resources/hostnames/p16-oec-ttp.tiktokcdn-us.com)
- [TikTok Domains Database (GitHub)](https://gist.github.com/RupGautam/e6953b6e0a68ece63e6721309135190f)

### FastMoss
- [FastMoss Official Website](https://www.fastmoss.com/)
- [FastMoss Product Hunt](https://www.producthunt.com/products/fastmoss)
- [FastMoss vs Kalodata Comparison (2026)](https://www.dashboardly.io/post/fastmoss-vs-kalodata-the-2025-battle-for-tiktok-shop-analytics-supremacy)

---

**Report Complete**
Next step: Implement Playwright-based extraction endpoint in `app/api/product-images/route.ts`
