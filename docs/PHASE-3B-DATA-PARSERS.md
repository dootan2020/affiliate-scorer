# PHASE 3B: DATA PARSERS

> Tham chiếu: ROADMAP-FINAL.md
> Goal: Import bulk data từ các platform vào app. Auto-detect file type. Merge với Campaign Tracker.
> Phụ thuộc: Phase 3A (Campaign Tracker) phải xong trước — parsers đổ data VÀO campaigns.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — bảng DataImport (log mỗi lần upload)
2. Upload page redesign — 4 zones, auto-detect
3. Auto-detect engine — nhận dạng file type từ headers
4. Parser: Facebook Ads CSV
5. Parser: TikTok Ads CSV
6. Parser: Shopee Ads CSV
7. Parser: TikTok Affiliate report
8. Parser: Shopee Affiliate report
9. Parser: KaloData CSV (sản phẩm)
10. Generic CSV parser (mapping thủ công)
11. Merge logic — match imported data → existing campaigns
12. YouTube Ads + Google Ads parsers (thêm sau khi user cần)
13. Test toàn bộ
```

**Ưu tiên:** FB Ads + TikTok Ads + Affiliate reports TRƯỚC. YouTube/Google Ads thêm khi user cần.

---

## 1. DATABASE SCHEMA

### Bảng DataImport (log mỗi lần upload)

```sql
CREATE TABLE data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,           -- "fastmoss" | "kalodata" | "fb_ads" | "tiktok_ads" | "shopee_ads" | "tiktok_affiliate" | "shopee_affiliate" | "generic" | "unknown"
  file_size INTEGER,
  
  -- Detection
  detected_type TEXT,                -- Kết quả auto-detect
  detection_confidence TEXT,         -- "high" | "medium" | "low"
  user_confirmed_type TEXT,          -- User confirm/override nếu detect sai
  
  -- Processing
  status TEXT DEFAULT 'pending',     -- "pending" | "processing" | "completed" | "failed" | "partial"
  rows_total INTEGER,
  rows_imported INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,   -- Duplicate hoặc invalid
  rows_error INTEGER DEFAULT 0,
  
  -- Kết quả
  campaigns_created INTEGER DEFAULT 0,
  campaigns_updated INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  financial_records_created INTEGER DEFAULT 0,
  
  error_log JSONB,                   -- Chi tiết lỗi từng row
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_data_imports_user_id ON data_imports(user_id);
CREATE INDEX idx_data_imports_file_type ON data_imports(file_type);
```

---

## 2. UPLOAD PAGE REDESIGN

### Layout:

```
Upload dữ liệu

Kéo thả file vào đây hoặc click để chọn
[═══════════════════════════════════════════]
Hỗ trợ: .xlsx, .xls, .csv, .tsv
Auto-detect loại file — bạn không cần chọn.

── Lịch sử upload ──

┌──────┬────────────────┬──────────────┬────────┬───────────────────┐
│ Ngày │ File           │ Loại         │ Status │ Kết quả           │
├──────┼────────────────┼──────────────┼────────┼───────────────────┤
│ 25/2 │ trending.xlsx  │ FastMoss     │ ✅     │ 300 SP (45 mới)   │
│ 24/2 │ fb_report.csv  │ FB Ads       │ ✅     │ 3 campaigns update│
│ 20/2 │ affiliate.xlsx │ TikTok Aff   │ ✅     │ 12 commissions    │
└──────┴────────────────┴──────────────┴────────┴───────────────────┘
```

### Flow sau khi drop file:

```
1. Upload file → server
2. Auto-detect type (dưới 1 giây)
3. Hiện kết quả detect:
   ┌─────────────────────────────────────────────────┐
   │ 📄 trending_20260224.xlsx                        │
   │ Nhận dạng: FastMoss sản phẩm (confidence: cao) │
   │ 300 dòng dữ liệu                                │
   │                                                  │
   │ [✅ Import] [🔄 Đổi loại ▼] [❌ Huỷ]           │
   └─────────────────────────────────────────────────┘
4. User confirm → process
5. Hiện kết quả:
   "✅ Import xong: 300 SP (45 mới, 255 cập nhật, 0 lỗi)"
```

---

## 3. AUTO-DETECT ENGINE

### Logic nhận dạng file type từ headers:

```typescript
interface DetectionResult {
  type: FileType;
  confidence: "high" | "medium" | "low";
  reason: string;
}

function detectFileType(headers: string[], sampleRows: any[]): DetectionResult {
  const headerStr = headers.join("|").toLowerCase();
  
  // FastMoss XLSX — tiếng Việt
  if (headerStr.includes("tên sản phẩm") && headerStr.includes("tỷ lệ hoa hồng") && headerStr.includes("fastmoss")) {
    return { type: "fastmoss", confidence: "high", reason: "Headers match FastMoss XLSX format" };
  }
  
  // FastMoss CSV — tiếng Anh (format cũ)
  if (headerStr.includes("product name") && headerStr.includes("commission rate") && headerStr.includes("kol")) {
    return { type: "fastmoss", confidence: "high", reason: "Headers match FastMoss CSV format" };
  }
  
  // KaloData
  if (headerStr.includes("kalodata") || (headerStr.includes("product") && headerStr.includes("kol") && headerStr.includes("revenue"))) {
    return { type: "kalodata", confidence: "medium", reason: "Headers suggest KaloData format" };
  }
  
  // Facebook Ads
  if (headerStr.includes("campaign name") && (headerStr.includes("amount spent") || headerStr.includes("spend")) && headerStr.includes("impressions")) {
    return { type: "fb_ads", confidence: "high", reason: "Headers match Facebook Ads export" };
  }
  // FB Ads tiếng Việt
  if (headerStr.includes("tên chiến dịch") && headerStr.includes("số tiền đã chi")) {
    return { type: "fb_ads", confidence: "high", reason: "Headers match Facebook Ads VN" };
  }
  
  // TikTok Ads
  if (headerStr.includes("ad group") && headerStr.includes("cost") && headerStr.includes("tiktok")) {
    return { type: "tiktok_ads", confidence: "high", reason: "Headers match TikTok Ads export" };
  }
  if (headerStr.includes("nhóm quảng cáo") && headerStr.includes("chi phí")) {
    return { type: "tiktok_ads", confidence: "medium", reason: "Headers suggest TikTok Ads VN" };
  }
  
  // Shopee Ads
  if (headerStr.includes("shopee") && headerStr.includes("ads") && (headerStr.includes("cost") || headerStr.includes("chi phí"))) {
    return { type: "shopee_ads", confidence: "medium", reason: "Headers suggest Shopee Ads" };
  }
  
  // TikTok Affiliate
  if (headerStr.includes("order") && headerStr.includes("commission") && headerStr.includes("tiktok")) {
    return { type: "tiktok_affiliate", confidence: "high", reason: "Headers match TikTok Affiliate report" };
  }
  if (headerStr.includes("mã đơn hàng") && headerStr.includes("hoa hồng")) {
    return { type: "tiktok_affiliate", confidence: "medium", reason: "Headers suggest Affiliate report VN" };
  }
  
  // Shopee Affiliate
  if (headerStr.includes("order") && headerStr.includes("commission") && headerStr.includes("shopee")) {
    return { type: "shopee_affiliate", confidence: "high", reason: "Headers match Shopee Affiliate" };
  }
  
  // Không nhận dạng được
  return { type: "unknown", confidence: "low", reason: "Không nhận dạng được. Vui lòng chọn loại file." };
}
```

### Khi confidence = "low" hoặc "unknown" → hiện dropdown cho user chọn:

```
Loại file: [Chọn loại ▼]
├── FastMoss sản phẩm
├── KaloData sản phẩm
├── Facebook Ads report
├── TikTok Ads report
├── Shopee Ads report
├── TikTok Affiliate report
├── Shopee Affiliate report
├── YouTube Ads report
├── Google Ads report
└── Khác (mapping thủ công)
```

---

## 4. PARSER: FACEBOOK ADS CSV

### Headers thường gặp:

```
Campaign name, Ad set name, Ad name, Amount spent (VND), 
Impressions, Reach, Clicks (link), CTR, CPC, 
Results, Cost per result, Frequency, 
Date start, Date end
```

### Mapping → Campaign + FinancialRecord:

```typescript
function parseFbAds(rows: FbAdsRow[], userId: string): ParseResult {
  const results: ParseResult = { campaigns: [], financialRecords: [] };
  
  // Group by Campaign name
  const grouped = groupBy(rows, 'campaign_name');
  
  for (const [campaignName, rows] of grouped) {
    // Thử match SP từ campaign name
    const matchedProduct = await fuzzyMatchProduct(campaignName, userId);
    
    // Tạo hoặc update campaign
    const campaign = {
      name: campaignName,
      platform: "facebook",
      source_type: "fb_ads_import",
      product_id: matchedProduct?.id || null,
      daily_results: rows.map(row => ({
        date: row.date_start,
        spend: parseVND(row.amount_spent),
        orders: parseInt(row.results) || 0,
        clicks: parseInt(row.clicks_link) || 0,
        impressions: parseInt(row.impressions) || 0,
        notes: `Import FB Ads — Ad: ${row.ad_name}`,
      })),
    };
    
    // Financial records
    for (const row of rows) {
      results.financialRecords.push({
        type: "ads_spend",
        amount: parseVND(row.amount_spent),
        source: "fb_ads",
        productId: matchedProduct?.id,
        date: row.date_start,
        note: `FB Ads: ${campaignName}`,
      });
    }
    
    results.campaigns.push(campaign);
  }
  
  return results;
}
```

### Merge logic:
- Nếu campaign đã tồn tại (match name + platform + date overlap) → UPDATE daily_results
- Nếu chưa → CREATE campaign mới
- Dedup: cùng campaign + cùng ngày → update thay vì duplicate

---

## 5. PARSER: TIKTOK ADS CSV

### Headers thường gặp:

```
Campaign, Ad Group, Ad, Cost, Impressions, Clicks, 
Conversions, Cost per Conversion, CTR, CPC,
Date
```

### Mapping — tương tự FB Ads:

```typescript
function parseTikTokAds(rows: TikTokAdsRow[], userId: string): ParseResult {
  // Logic tương tự parseFbAds
  // platform: "tiktok"
  // source_type: "tiktok_ads_import"
  // Mapping: Cost → spend, Conversions → orders
}
```

---

## 6. PARSER: SHOPEE ADS CSV

### Headers thường gặp:

```
Tên chiến dịch, Loại quảng cáo, Chi phí, Lượt hiển thị, 
Lượt click, Đơn hàng, Doanh thu, ROAS, Ngày
```

### Mapping — tương tự, platform = "shopee"

---

## 7. PARSER: TIKTOK AFFILIATE REPORT

### Đây là báo cáo HOA HỒNG, khác với Ads:

```
Mã đơn hàng, Tên sản phẩm, Giá sản phẩm, Số lượng,
Hoa hồng (%), Hoa hồng (VND), Trạng thái, Ngày đặt hàng
```

### Mapping → FinancialRecord (không tạo campaign):

```typescript
function parseTikTokAffiliate(rows: TikTokAffRow[], userId: string): ParseResult {
  const results: ParseResult = { financialRecords: [], productUpdates: [] };
  
  for (const row of rows) {
    // Match SP
    const product = await fuzzyMatchProduct(row.product_name, userId);
    
    // Financial record
    results.financialRecords.push({
      type: row.status === "completed" ? "commission_received" : "commission_pending",
      amount: parseVND(row.commission_vnd),
      source: "tiktok_shop",
      productId: product?.id,
      date: row.order_date,
      note: `TikTok Affiliate — Order ${row.order_id}`,
      metadata: { orderId: row.order_id, status: row.status },
    });
    
    // Dedup by order_id
  }
  
  return results;
}
```

### Dedup: Dùng order_id — nếu đã import order → skip hoặc update status.

---

## 8. PARSER: SHOPEE AFFILIATE REPORT

### Tương tự TikTok Affiliate, source = "shopee"

---

## 9. PARSER: KALODATA CSV

### Headers:

```
Product Name, Price, Commission Rate, Sales 7D, Revenue 7D,
Total Sales, Total Revenue, KOL Count, Category, Shop Name, ...
```

### Mapping → Product (giống FastMoss parser):
- Tạo Product mới hoặc update nếu đã tồn tại
- Score bằng AI scoring engine hiện tại
- Dedup bằng tên + shop + price

---

## 10. GENERIC CSV PARSER

### Cho file "không nhận dạng được" — user mapping thủ công:

```
┌─────────────────────────────────────────────────┐
│ 🔧 Mapping cột dữ liệu                         │
│                                                  │
│ File có 12 cột. Map vào trường nào?             │
│                                                  │
│ Cột "Campaign"  → [Tên campaign ▼]              │
│ Cột "Cost"      → [Chi phí ads ▼]               │
│ Cột "Orders"    → [Số đơn ▼]                    │
│ Cột "Revenue"   → [Doanh thu ▼]                 │
│ Cột "Date"      → [Ngày ▼]                      │
│ Cột "Channel"   → [Bỏ qua ▼]                   │
│ ...                                              │
│                                                  │
│ Loại data: [Ads report ▼] / [Commission ▼]      │
│                                                  │
│ [Preview 5 dòng đầu]                            │
│                                                  │
│            [Import]  [Huỷ]                       │
└─────────────────────────────────────────────────┘
```

Dropdown options cho mỗi cột:
- Tên campaign / Tên sản phẩm / Chi phí / Doanh thu / Số đơn / Hoa hồng
- Ngày / Platform / Ghi chú / Mã đơn hàng
- Bỏ qua (không import)

---

## 11. MERGE LOGIC

### Quan trọng: Import data phải merge VÀO campaigns đã có, không tạo trùng.

```typescript
async function mergeImportedCampaign(
  imported: ImportedCampaign, 
  userId: string
): Promise<"created" | "updated"> {
  
  // 1. Tìm campaign match
  const existing = await findMatchingCampaign({
    name: imported.name,
    platform: imported.platform,
    productId: imported.productId,
    dateRange: { start: imported.startDate, end: imported.endDate },
    userId,
  });
  
  if (existing) {
    // 2A. Merge daily_results — update ngày đã có, thêm ngày mới
    const mergedResults = mergeDailyResults(
      existing.daily_results,
      imported.daily_results
    );
    
    await updateCampaign(existing.id, {
      daily_results: mergedResults,
      source_type: imported.source_type, // Mark as imported
      data_import_id: imported.importId,
    });
    
    // Recalculate summary
    await recalculateCampaignSummary(existing.id);
    
    return "updated";
    
  } else {
    // 2B. Tạo campaign mới
    await createCampaign({
      ...imported,
      status: "completed", // Import = đã chạy xong
      userId,
    });
    
    return "created";
  }
}

function mergeDailyResults(existing: DailyResult[], imported: DailyResult[]): DailyResult[] {
  const map = new Map<string, DailyResult>();
  
  // Existing first
  for (const r of existing) map.set(r.date, r);
  
  // Imported override (data từ platform chính xác hơn nhập tay)
  for (const r of imported) map.set(r.date, { ...map.get(r.date), ...r });
  
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
```

### Match rules:
1. **Exact match:** Same campaign name + platform + productId → UPDATE
2. **Fuzzy match:** Similar name + same platform + overlapping dates → ASK USER confirm
3. **No match:** → CREATE new campaign

---

## 12. FASTMOSS XLSX PARSER — UPDATE

### Cập nhật parser hiện tại để:
- Hỗ trợ headers tiếng Việt (file mới)
- Hỗ trợ headers tiếng Anh (file cũ)
- Parse giá "₫129.000" và "50.000₫" (vị trí ₫ không nhất quán)
- Parse "15%" và "-" cho commission
- Parse "81,45%" (dấu phẩy thập phân)
- Log vào DataImport table

```typescript
function parseVietnamesePrice(value: string): number | null {
  if (!value || value === '-') return null;
  // Remove ₫, dấu chấm (thousand separator), spaces
  const cleaned = value.replace(/[₫.\s]/g, '').replace(/,/g, '');
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

function parseVietnamesePercent(value: string): number | null {
  if (!value || value === '-') return null;
  // "81,45%" → 81.45
  const cleaned = value.replace('%', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
```

---

## 13. PRODUCT FUZZY MATCH

### Khi import ads report, cần match campaign name → Product:

```typescript
async function fuzzyMatchProduct(
  searchText: string, 
  userId: string
): Promise<Product | null> {
  // 1. Exact match tên SP
  let product = await findProductByName(searchText, userId);
  if (product) return product;
  
  // 2. Partial match — campaign name chứa tên SP
  const products = await getAllProducts(userId);
  for (const p of products) {
    if (searchText.toLowerCase().includes(p.name.toLowerCase())) {
      return p;
    }
    if (p.name.toLowerCase().includes(searchText.toLowerCase())) {
      return p;
    }
  }
  
  // 3. Không match → return null (user có thể link thủ công sau)
  return null;
}
```

---

## TEST CHECKLIST

- [ ] Upload FastMoss XLSX mới (tiếng Việt) → import OK
- [ ] Upload FastMoss CSV cũ (tiếng Anh) → vẫn OK
- [ ] Auto-detect nhận đúng loại file
- [ ] Unknown file → hiện dropdown cho user chọn
- [ ] FB Ads CSV → tạo campaigns + financial records
- [ ] TikTok Ads CSV → tạo campaigns + financial records
- [ ] TikTok Affiliate → tạo financial records, dedup by order_id
- [ ] Shopee Affiliate → tương tự
- [ ] KaloData CSV → tạo products, score đúng
- [ ] Generic parser → user mapping OK
- [ ] Merge: import data → update campaign đã có (không duplicate)
- [ ] Import history hiện trên upload page
- [ ] DataImport log đúng (rows total/imported/skipped/error)
- [ ] Build pass, không lỗi
