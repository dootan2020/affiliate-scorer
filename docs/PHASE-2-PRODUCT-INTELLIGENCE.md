# PHASE 2: PRODUCT INTELLIGENCE

> Tham chiếu: ROADMAP-FINAL-V2.md
> Goal: Paste link vào app → SP vào Inbox → auto dedupe → score → biết SP nào mới/tăng/giảm.
> Giữ nguyên: FastMoss upload + scoring hiện tại vẫn chạy.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — product_identities, product_urls, inbox_items
2. Link parser — nhận diện loại link (product/video/shop)
3. Canonical URL + fingerprint dedupe
4. Paste Links UI (ô lớn, paste nhiều link)
5. Inbox page (/inbox) — cards + filter by state
6. Connect FastMoss upload → product_identities (merge, không duplicate)
7. Delta classification (NEW/SURGE/COOL/STABLE/REAPPEAR)
8. Content Potential Score
9. Quick add fields (manual enrich 10 giây)
10. Dashboard update — thêm quick paste + inbox stats
```

---

## 1. DATABASE SCHEMA

### Bảng product_identities (canonical, 1 SP = 1 identity)

```sql
CREATE TABLE product_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  canonical_url TEXT UNIQUE,              -- TikTok Shop URL (chuẩn hóa)
  fingerprint_hash TEXT UNIQUE,           -- sha256(canonical_url + normalized_title + shop_name)
  product_id_external TEXT,               -- ID từ TikTok Shop URL (nếu parse được)
  
  -- Metadata cơ bản (có thể thiếu, nullable HẾT)
  title TEXT,
  shop_name TEXT,
  category TEXT,
  price INTEGER,                          -- VND, nullable
  commission_rate DECIMAL(5,2),           -- %, nullable
  image_url TEXT,
  description TEXT,
  
  -- State trong Inbox
  inbox_state TEXT NOT NULL DEFAULT 'new',
    -- "new" | "enriched" | "scored" | "briefed" | "published" | "archived"
  
  -- Scores (nullable, tính khi có đủ data)
  market_score DECIMAL(5,2),
  content_potential_score DECIMAL(5,2),
  combined_score DECIMAL(5,2),
  
  -- Lifecycle
  lifecycle_stage TEXT,                   -- "new" | "rising" | "hot" | "peak" | "declining" | "unknown"
  delta_type TEXT,                        -- "NEW" | "SURGE" | "COOL" | "STABLE" | "REAPPEAR"
  
  -- User data (ghi chú, rating — optional)
  personal_notes TEXT,
  personal_rating INTEGER,                -- 1-5
  personal_tags JSONB DEFAULT '[]',
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pi_canonical_url ON product_identities(canonical_url);
CREATE INDEX idx_pi_fingerprint ON product_identities(fingerprint_hash);
CREATE INDEX idx_pi_inbox_state ON product_identities(inbox_state);
CREATE INDEX idx_pi_combined_score ON product_identities(combined_score DESC NULLS LAST);
```

### Bảng product_urls (nhiều URL → 1 identity)

```sql
CREATE TABLE product_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_identity_id UUID NOT NULL REFERENCES product_identities(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  url_type TEXT NOT NULL,                 -- "tiktokshop" | "fastmoss" | "kalodata" | "manual" | "video" | "shop"
  
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(url)
);

CREATE INDEX idx_pu_identity ON product_urls(product_identity_id);
CREATE INDEX idx_pu_url ON product_urls(url);
```

### Bảng inbox_items (mỗi link paste vào = 1 item)

```sql
CREATE TABLE inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link gốc
  raw_url TEXT NOT NULL,
  detected_type TEXT NOT NULL,            -- "product" | "video" | "shop" | "unknown"
  
  -- Liên kết (nullable, match sau)
  product_identity_id UUID REFERENCES product_identities(id),
  
  -- Metadata extract được (nullable HẾT)
  extracted_title TEXT,
  extracted_metadata JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- "pending" | "matched" | "new_product" | "duplicate" | "failed"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Quan hệ với bảng products hiện tại

```
products (hiện tại) ←→ product_identities (mới)

Cách merge:
- Mỗi product hiện tại → tạo 1 product_identity
- Match bằng: TikTok URL từ FastMoss data (cột "Địa chỉ trang đích sản phẩm TikTok")
- products table vẫn giữ (backward compatible)
- product_identities.id link về products.id qua field mới: products.identity_id
```

Migration strategy:
```sql
-- Thêm identity_id vào products
ALTER TABLE products ADD COLUMN identity_id UUID REFERENCES product_identities(id);

-- Script migrate: tạo product_identities từ products hiện tại
-- Chạy 1 lần sau migration
```

---

## 2. LINK PARSER

### Nhận diện loại link:

```typescript
interface ParsedLink {
  originalUrl: string;
  type: "product" | "video" | "shop" | "fastmoss_product" | "fastmoss_shop" | "unknown";
  canonicalUrl: string | null;    // Chuẩn hóa
  externalId: string | null;      // Product ID / Video ID / Shop ID
}

function parseLink(url: string): ParsedLink {
  const cleaned = url.trim();
  
  // TikTok Shop product
  // https://shop.tiktok.com/view/product/1734173371940046760
  // https://www.tiktok.com/view/product/...
  if (cleaned.match(/tiktok\.com\/.*\/product\/(\d+)/)) {
    const id = cleaned.match(/product\/(\d+)/)?.[1];
    return {
      originalUrl: cleaned,
      type: "product",
      canonicalUrl: `https://shop.tiktok.com/view/product/${id}`,
      externalId: id,
    };
  }
  
  // TikTok video
  // https://www.tiktok.com/@user/video/7379957713536601351
  // https://vt.tiktok.com/ZS...
  if (cleaned.match(/tiktok\.com\/.*\/video\/(\d+)/) || cleaned.match(/vt\.tiktok\.com/)) {
    const id = cleaned.match(/video\/(\d+)/)?.[1];
    return {
      originalUrl: cleaned,
      type: "video",
      canonicalUrl: cleaned,
      externalId: id,
    };
  }
  
  // TikTok Shop (shop page)
  // https://shop.tiktok.com/view/shop/7495757114449955752
  if (cleaned.match(/tiktok\.com\/.*\/shop\/(\d+)/)) {
    const id = cleaned.match(/shop\/(\d+)/)?.[1];
    return {
      originalUrl: cleaned,
      type: "shop",
      canonicalUrl: `https://shop.tiktok.com/view/shop/${id}`,
      externalId: id,
    };
  }
  
  // FastMoss product
  // https://www.fastmoss.com/zh/e-commerce/detail/1734173371940046760
  if (cleaned.match(/fastmoss\.com\/.*\/detail\/(\d+)/)) {
    const id = cleaned.match(/detail\/(\d+)/)?.[1];
    return {
      originalUrl: cleaned,
      type: "fastmoss_product",
      canonicalUrl: `https://shop.tiktok.com/view/product/${id}`, // Convert → TikTok canonical
      externalId: id,
    };
  }
  
  // FastMoss shop
  if (cleaned.match(/fastmoss\.com\/.*\/shop-marketing\/detail\/(\d+)/)) {
    const id = cleaned.match(/detail\/(\d+)/)?.[1];
    return {
      originalUrl: cleaned,
      type: "fastmoss_shop",
      canonicalUrl: `https://shop.tiktok.com/view/shop/${id}`,
      externalId: id,
    };
  }
  
  return {
    originalUrl: cleaned,
    type: "unknown",
    canonicalUrl: null,
    externalId: null,
  };
}

// Batch parse: split by newline, parse each
function parseLinks(text: string): ParsedLink[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith('http'))
    .map(parseLink);
}
```

---

## 3. CANONICAL URL + FINGERPRINT

```typescript
function canonicalizeUrl(url: string): string {
  const parsed = new URL(url);
  // Remove tracking params
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
   'ref', 'fbclid', 'gclid', 'region', 'local', 'locale'].forEach(p => {
    parsed.searchParams.delete(p);
  });
  // Normalize
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.pathname = parsed.pathname.replace(/\/+$/, ''); // Remove trailing slash
  return parsed.toString();
}

function generateFingerprint(
  canonicalUrl: string | null,
  title: string | null,
  shopName: string | null
): string {
  const input = [
    canonicalUrl || '',
    (title || '').toLowerCase().trim(),
    (shopName || '').toLowerCase().trim(),
  ].join('|');
  return sha256(input);
}
```

### Dedupe logic khi paste link:

```typescript
async function processInboxItem(parsed: ParsedLink): Promise<ProcessResult> {
  // 1. Check canonical URL match
  if (parsed.canonicalUrl) {
    const existing = await findByCanonicalUrl(parsed.canonicalUrl);
    if (existing) {
      // Update last_seen, add URL nếu chưa có
      await updateLastSeen(existing.id);
      await addUrlIfNew(existing.id, parsed.originalUrl, parsed.type);
      return { status: "duplicate", identityId: existing.id };
    }
  }
  
  // 2. Check external ID match
  if (parsed.externalId) {
    const existing = await findByExternalId(parsed.externalId);
    if (existing) {
      await updateLastSeen(existing.id);
      return { status: "duplicate", identityId: existing.id };
    }
  }
  
  // 3. Mới → tạo product_identity
  const identity = await createProductIdentity({
    canonical_url: parsed.canonicalUrl,
    product_id_external: parsed.externalId,
    fingerprint_hash: generateFingerprint(parsed.canonicalUrl, null, null),
    inbox_state: "new",
  });
  
  await addUrl(identity.id, parsed.originalUrl, parsed.type);
  
  return { status: "new_product", identityId: identity.id };
}
```

---

## 4. PASTE LINKS UI

### /inbox page — header:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Inbox                                                        │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Paste links vào đây (product, video, shop — TikTok/FastMoss)││
│ │                                                              ││
│ │ https://shop.tiktok.com/view/product/173417...               ││
│ │ https://www.tiktok.com/@user/video/73799...                  ││
│ │ https://www.fastmoss.com/zh/e-commerce/detail/17341...       ││
│ │                                                              ││
│ └──────────────────────────────────────────────────────────────┘│
│ [Thêm vào Inbox]                                                │
│                                                                  │
│ Kết quả: 3 links → 2 SP mới, 1 duplicate (đã có), 1 video     │
└─────────────────────────────────────────────────────────────────┘
```

### Inbox cards (bên dưới):

```
Filter: [Tất cả] [New] [Scored] [Briefed] [Published]

┌─────────────────────────┐ ┌─────────────────────────┐
│ 🏷️ NEW                  │ │ 🏷️ SCORED               │
│ Serum Vitamin C 65g     │ │ Vòng tay bạc 925        │
│ MANY COLORS             │ │ LC Jewelry              │
│ ₫129.000 | 15%          │ │ ₫252.000 | 12%          │
│                         │ │                         │
│ Market: --              │ │ Market: 77              │
│ Content: --             │ │ Content: 82             │
│                         │ │                         │
│ [Enrich] [Score]        │ │ [Tạo Brief] [Archive]   │
└─────────────────────────┘ └─────────────────────────┘
```

---

## 5. FASTMOSS UPLOAD → PRODUCT IDENTITIES

### Cập nhật flow upload hiện tại:

```
Upload FastMoss XLSX
    ↓
Parse rows (giữ nguyên parser hiện tại)
    ↓
Cho MỖI row:
    ├── Lấy canonical URL từ cột "Địa chỉ trang đích sản phẩm TikTok"
    ├── Check product_identities bằng canonical_url
    ├── Nếu tồn tại → update metadata + tạo snapshot
    ├── Nếu mới → tạo product_identity + product (cũ) + snapshot
    └── Tạo delta (so sánh snapshot mới vs cũ)
```

### QUAN TRỌNG: backward compatible

```
- Bảng products vẫn tồn tại, vẫn có data
- Thêm products.identity_id link về product_identities
- Dashboard, detail page, scoring → vẫn dùng products table
- product_identities = layer mới ở trên, dùng cho Inbox + dedupe
- Migrate dần, không break code cũ
```

---

## 6. DELTA CLASSIFICATION

### Khi upload FastMoss mới, so sánh snapshot T vs T-1:

```typescript
type DeltaType = "NEW" | "SURGE" | "COOL" | "STABLE" | "REAPPEAR";

function classifyDelta(current: Snapshot, previous: Snapshot | null): DeltaType {
  if (!previous) return "NEW";
  
  // Check REAPPEAR: absent trong 2+ snapshots gần nhất rồi quay lại
  // (cần check snapshot history, không chỉ T-1)
  
  const salesChange = previous.sales7d > 0
    ? (current.sales7d - previous.sales7d) / previous.sales7d
    : 0;
  
  if (salesChange > 0.5) return "SURGE";    // Tăng >50%
  if (salesChange < -0.3) return "COOL";     // Giảm >30%
  return "STABLE";
}
```

### UI: /sync page sau upload:

```
Upload FastMoss — 300 SP

📊 Delta Summary:
├── 🆕 15 NEW — chưa thấy trước đó
├── 🚀 8 SURGE — sales tăng >50%
├── ❄️ 5 COOL — sales giảm >30%
├── ➡️ 270 STABLE — không đổi nhiều
└── 🔄 2 REAPPEAR — quay lại sau khi mất

[Xem danh sách NEW + SURGE →]
```

---

## 7. CONTENT POTENTIAL SCORE

### Tính cho mỗi SP (có thể partial data):

```typescript
function calculateContentPotentialScore(product: ProductIdentity): number {
  let score = 0;
  let maxScore = 0;
  
  // 3-second wow — có gì visual/gây chú ý? (0-20)
  if (product.image_url) {
    score += 10; // Có ảnh = có nguyên liệu
    maxScore += 20;
  }
  if (product.price && product.price < 200000) {
    score += 10; // Giá sốc = easy hook
    maxScore += 20;
  } else {
    maxScore += 20;
  }
  
  // Số angle — category có nhiều góc content? (0-20)
  const categoryAngles = getCategoryAngleCount(product.category);
  score += Math.min(20, categoryAngles * 4); // 5 angles = 20
  maxScore += 20;
  
  // Dễ dựng AI — không cần cầm hàng thật? (0-20)
  const aiScore = getAIFriendlyScore(product.category);
  score += aiScore;
  maxScore += 20;
  
  // KOL/video count — có UGC làm nguyên liệu? (0-20)
  if (product.kol_count !== null) {
    score += product.kol_count > 10 ? 15 : product.kol_count * 3;
    maxScore += 20;
  }
  
  // Rủi ro (trừ điểm) (0-20)
  const riskPenalty = calculateRiskPenalty(product.category, product.title);
  score -= riskPenalty;
  maxScore += 20;
  
  // Normalize to 0-100, dựa trên fields HIỆN CÓ
  return maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
}
```

---

## 8. QUICK ADD FIELDS

### Khi SP mới chưa có metadata → modal enrich 10 giây:

```
┌─────────────────────────────────────────────────┐
│ ✏️ Thêm thông tin nhanh                         │
│                                                  │
│ Tên SP: [auto-fill nếu có, hoặc nhập]          │
│ Giá:    [___] VND (bỏ qua được)                │
│ Danh mục: [dropdown hoặc bỏ qua]               │
│ Commission: [___]% (bỏ qua được)               │
│ Ghi chú: [Thấy trên FYP đang viral]            │
│                                                  │
│ [Bỏ qua] [Lưu]                                 │
└─────────────────────────────────────────────────┘
```

**Tất cả fields optional.** User có thể bỏ qua 100% → SP vẫn vào Inbox, vẫn score được (partial).

---

## GUARDRAILS

```
❌ KHÔNG scrape TikTok Shop URL để lấy metadata
❌ KHÔNG require fields trước khi cho SP vào Inbox
❌ KHÔNG block scoring vì thiếu giá/commission
❌ KHÔNG break FastMoss upload flow hiện tại
✅ Canonical URL parse + dedupe = tự động
✅ Mọi field metadata = nullable
✅ Score partial = OK
✅ products table vẫn hoạt động (backward compatible)
```

---

## TEST CHECKLIST

- [ ] Paste 1 link TikTok Shop → vào Inbox, type = product
- [ ] Paste 1 link TikTok video → vào Inbox, type = video
- [ ] Paste 5 links cùng lúc → parse đúng từng loại
- [ ] Paste link trùng → detect duplicate, không tạo mới
- [ ] FastMoss upload → tạo product_identities, link về products
- [ ] FastMoss upload lần 2 → delta đúng (NEW/SURGE/COOL/STABLE)
- [ ] Inbox filter by state hoạt động
- [ ] Quick add fields lưu đúng
- [ ] Content Potential Score tính được với partial data
- [ ] Dashboard vẫn chạy đúng (backward compatible)
- [ ] Detail page vẫn chạy đúng
- [ ] Build pass, không lỗi
