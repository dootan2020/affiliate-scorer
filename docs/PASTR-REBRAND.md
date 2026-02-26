4 việc trong 1 commit. Làm theo thứ tự.

---

## VIỆC 1: Bỏ env var cho API keys

Hiện tại code check `process.env.ANTHROPIC_API_KEY` rồi fallback DB. Đổi lại:

- **CHỈ lấy API key từ DB** (bảng ApiProvider, encrypted)
- **Xóa logic check env var** trong `lib/ai/providers.ts` (hoặc file tương đương): bỏ `isFromEnv`, bỏ fallback `process.env.ANTHROPIC_API_KEY`, bỏ `process.env.OPENAI_API_KEY`, bỏ `process.env.GOOGLE_AI_API_KEY`
- **Giữ lại duy nhất** `process.env.ENCRYPTION_KEY` — đây là master key mã hóa, bắt buộc ở env var
- Cập nhật `/api/settings/api-keys/status`: không check env var nữa, chỉ check DB
- Cập nhật Settings UI: bỏ text "Đã kết nối qua biến môi trường", tất cả provider đều cùng flow: nhập key → test → save
- Cập nhật `.env.example`: chỉ còn `DATABASE_URL`, `ENCRYPTION_KEY`, và các env var non-secret (NEXT_PUBLIC_*)
- Schema ApiProvider: bỏ field `isFromEnv` nếu có

---

## VIỆC 2: Rebrand → PASTR

### Tên & Tagline
- App name: **PASTR**
- Tagline: **Paste links. Ship videos. Learn fast.**
- Mô tả SEO: "PASTR — Công cụ AI giúp sản xuất video affiliate TikTok nhanh hơn"

### Files cần update

**Sidebar + Header:**
- `components/layout/sidebar.tsx`: "Content Factory" → "PASTR"
- Mobile header: "Content Factory" → "PASTR"
- Font style cho brand: `text-xl font-bold tracking-tight` (chữ PASTR nên đậm nổi bật)

**SEO — `app/layout.tsx` metadata:**
```typescript
export const metadata: Metadata = {
  title: {
    default: 'PASTR — AI Video Affiliate',
    template: '%s | PASTR',
  },
  description: 'Paste links. Ship videos. Learn fast. Công cụ AI sản xuất video affiliate TikTok.',
  openGraph: {
    title: 'PASTR — Paste links. Ship videos. Learn fast.',
    description: 'Công cụ AI giúp sản xuất video affiliate TikTok nhanh hơn',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PASTR — AI Video Affiliate',
    description: 'Paste links. Ship videos. Learn fast.',
  },
};
```

**Từng page title (template sẽ auto thêm "| PASTR"):**
- Dashboard: `title: 'Dashboard'`
- Inbox: `title: 'Inbox'`
- Sync: `title: 'Đồng bộ dữ liệu'`
- Production: `title: 'Sản xuất'`
- Log: `title: 'Log'`
- Library: `title: 'Thư viện'`
- Insights: `title: 'AI Insights'`
- Settings: `title: 'Cài đặt'`

**Các chỗ khác có "AffiliateScorer" hoặc "Content Factory":**
```bash
grep -rn "AffiliateScorer\|Content Factory\|affiliate-scorer" --include="*.tsx" --include="*.ts" --include="*.json" --include="*.md" app/ components/ lib/ package.json
```
Đổi tất cả → "PASTR" (trừ URL Vercel — không đổi được từ code).

**package.json:**
```json
"name": "pastr"
```

**404 page:** "Về trang chủ" link text giữ nguyên, title cập nhật.

### Logo & Favicon

Tạo logo cho PASTR — style minimalist, modern, phù hợp app SaaS:

**Logo text:**
- Chữ "PASTR" font-weight 800 (extra bold), letter-spacing tight
- Màu: `text-gray-900 dark:text-gray-50`
- Có thể thêm accent: chữ "P" hoặc ký tự đầu màu cam `#E87B35`

**Icon mark (favicon + mobile icon):**
- Tạo SVG icon đơn giản — gợi ý: chữ "P" cách điệu trong hình tròn/vuông bo góc, màu cam #E87B35 nền, chữ trắng
- Hoặc: biểu tượng paste/clipboard kết hợp play button (gợi paste link + video)
- Kích thước: 32x32 (favicon), 192x192 (PWA), 512x512 (PWA large)

**Files cần tạo/update:**
- `public/favicon.ico` — tạo mới từ SVG icon (32x32)
- `public/icon.svg` — SVG icon mark
- `public/apple-touch-icon.png` — 180x180
- `public/icon-192.png` — 192x192
- `public/icon-512.png` — 512x512
- `app/icon.tsx` — Next.js dynamic icon (nếu đang dùng)
- Sidebar: thay text "PASTR" bằng icon + text: `<Icon className="w-6 h-6" /> PASTR`

**Cách tạo:**
- Dùng code SVG trực tiếp (không cần tool bên ngoài)
- Convert SVG → PNG bằng sharp hoặc canvas nếu cần
- Favicon: dùng SVG favicon (modern browsers support) + ICO fallback

---

## VIỆC 3: First-time setup flow

Khi chưa có API key nào trong DB (user mới hoặc deploy mới):

### Banner component
Tạo `components/shared/setup-banner.tsx`:
```tsx
// Banner nhỏ, hiện ở đầu mọi trang khi chưa có API key
// Style: bg-amber-50 border border-amber-200 rounded-xl p-4
// Icon: ⚠️ 
// Text: "Chưa có API key. Vui lòng kết nối ít nhất 1 nhà cung cấp AI để sử dụng."
// CTA: Link "Đi đến Cài đặt →" → /settings
// Có nút X để dismiss tạm thời (chỉ dismiss trong session, reload lại hiện)
```

### Nơi hiện banner
Thêm vào layout chính (main content area), check điều kiện:
- Gọi `/api/settings/api-keys/status` 
- Nếu KHÔNG có provider nào `isConnected: true` → hiện banner
- Nếu có ít nhất 1 connected → ẩn banner

### Các chỗ gọi AI cần handle gracefully
Khi callAI() không tìm được key:
- KHÔNG throw error crash page
- Return message rõ ràng: "Chưa cấu hình API key. Vui lòng vào Cài đặt để kết nối."
- Morning Brief widget: hiện message thay vì loading mãi
- Scoring: hiện toast rõ ràng
- Brief generation: hiện message trong UI

---

## VIỆC 4: Database migration

```bash
npx prisma db push
```

Nếu lỗi (table ApiProvider chưa tồn tại hoặc field thay đổi): dùng `--accept-data-loss` nếu cần (bảng mới, không mất data cũ).

Verify: `npx prisma studio` → confirm bảng ApiProvider tồn tại.

---

## SAU KHI XONG

Build check:
```bash
pnpm build
```

Grep check:
```bash
# Không còn AffiliateScorer / Content Factory
grep -rn "AffiliateScorer\|Content Factory" --include="*.tsx" --include="*.ts" app/ components/ lib/

# Không còn process.env.*_API_KEY (trừ ENCRYPTION_KEY)
grep -rn "process.env.ANTHROPIC_API_KEY\|process.env.OPENAI_API_KEY\|process.env.GOOGLE_AI_API_KEY" --include="*.ts" --include="*.tsx" lib/ app/
```

Cả 2 grep phải trả về 0 results.

Commit message: "rebrand PASTR + API keys via UI only + first-time setup banner"
Push, Vercel deploy.

Sau deploy: vào Vercel → Settings → Environment Variables → thêm `ENCRYPTION_KEY` (nếu chưa có).
