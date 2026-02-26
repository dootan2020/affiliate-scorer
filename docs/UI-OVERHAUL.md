KHÔNG IMPLEMENT NGAY. Đọc toàn bộ yêu cầu, quét codebase, rồi viết file docs/PLAN-UI-OVERHAUL.md để duyệt trước. Plan phải có: mô tả thay đổi, file cần sửa, mockup text mô tả layout, design tokens cụ thể (hex, font-size, spacing), và thứ tự thực hiện. Chỉ bắt đầu code SAU KHI viết xong plan.

---

## 1. TRANG SETTINGS — Chọn AI Model theo tác vụ

Tạo trang `/settings` (thêm vào sidebar, icon ⚙️, đặt dưới cùng).

### 1A. Fetch danh sách models
Khi user đã nhập API key (Anthropic), gọi API để lấy danh sách models available. Nếu chưa có key → hiện form nhập key + nút "Lưu" (lưu vào DB hoặc env var trên server, KHÔNG lưu localStorage).

Anthropic API: `GET https://api.anthropic.com/v1/models` với header `x-api-key` và `anthropic-version: 2023-06-01`.

### 1B. Tên model thân thiện
Map model ID sang tên thân thiện hiển thị cho user:

| Model ID | Tên hiển thị | Ghi chú |
|----------|-------------|---------|
| claude-opus-4-6 | Claude Opus 4.6 (Mạnh nhất) | |
| claude-sonnet-4-5-20250929 | Claude Sonnet 4.5 (Cân bằng) | |
| claude-haiku-4-5-20251001 | Claude Haiku 4.5 (Nhanh & rẻ) | |
| Các model khác từ API | Hiện tên gốc | Fallback |

### 1C. UI chọn model theo tác vụ
4 dropdown, mỗi cái chọn model riêng:

```
Cài đặt AI Model
─────────────────────────────────────
Chấm điểm sản phẩm:    [Claude Sonnet 4.5 (Cân bằng)  ▼]
Tạo brief & scripts:    [Claude Opus 4.6 (Mạnh nhất)   ▼]
Tóm tắt buổi sáng:      [Claude Sonnet 4.5 (Cân bằng)  ▼]
Báo cáo tuần:            [Claude Sonnet 4.5 (Cân bằng)  ▼]
─────────────────────────────────────
[Lưu cài đặt]
```

Default: Sonnet cho 3 việc, Opus cho brief generation.

### 1D. Backend
- Tạo model `AiSettings` trong schema (userId, taskType, modelId)
- Hoặc dùng JSON field trong User model nếu đơn giản hơn
- Mọi chỗ gọi Anthropic API (scoring, brief, morning brief, weekly report) phải đọc settings để chọn đúng model
- Nếu chưa có settings → dùng default

---

## 2. FIX ẢNH SẢN PHẨM — Dashboard "Nên tạo content"

Ảnh bị lỗi hiển thị (chỉ hiện text placeholder thay vì ảnh thật). Nguyên nhân có thể:
- Image URL từ TikTok/FastMoss bị CORS block → cần dùng `/api/image-proxy`
- Component không dùng image proxy
- Hoặc `next/image` không config domain

Fix: Quét component `ContentSuggestionsWidget` (hoặc tên tương đương trên dashboard). Đảm bảo:
- Dùng `/api/image-proxy?url=` cho ảnh external
- Có fallback khi ảnh lỗi (hiện icon sản phẩm thay vì text)
- Cũng quét tất cả component khác hiện ảnh SP (inbox table, inbox detail, library) — fix đồng bộ

---

## 3. DESIGN OVERHAUL — Typography, Colors, Spacing

### 3A. Nghiên cứu trend
Tìm kiếm web: "2025 2026 dashboard UI design trends", "SaaS dashboard design system", "modern web app typography". Áp dụng trend phù hợp (clean, readable, spacious).

### 3B. Design Tokens

Màu chính: **Cam Claude** (`#E87B35` hoặc tương đương). Xây dựng color palette đầy đủ:

```
Primary: cam Claude (buttons, links, active states, accents)
Primary hover: cam đậm hơn
Primary light: cam nhạt (background highlight, badges)
Background: trắng hoặc gray rất nhạt
Surface: trắng (cards)
Text primary: đen/gray đậm (dễ đọc)
Text secondary: gray trung
Border: gray nhạt
Success: xanh lá
Warning: vàng
Error: đỏ
```

Mỗi màu cần dark mode variant.

### 3C. Typography
Font hiện tại khó đọc, tiêu đề nhỏ. Yêu cầu:
- Font: chọn font đẹp, dễ đọc tiếng Việt có dấu (VD: Inter, Be Vietnam Pro, hoặc font tốt hơn — ClaudeKit tự chọn)
- Heading sizes phải ĐỦ LỚN: h1 ≥ 28px, h2 ≥ 22px, h3 ≥ 18px
- Body text ≥ 15px, line-height thoáng (1.6+)
- Font weight: headings bold (600-700), body regular (400)

### 3D. Spacing & Layout
- Cards: padding đủ rộng, border-radius mềm mại
- Giữa các sections: spacing rõ ràng
- Tables: rows cao hơn, text không bị chật
- Buttons: đủ lớn, dễ bấm trên mobile

### 3E. Áp dụng
- Cập nhật `tailwind.config.ts`: theme colors, fonts, spacing
- Cập nhật `globals.css`: base styles
- Cập nhật tất cả components dùng màu cũ → màu mới
- Sidebar: màu cam cho active item
- Buttons primary: nền cam, text trắng
- Links: màu cam
- Cards: shadow nhẹ, hover effect

---

## 4. FIX TIẾNG VIỆT THIẾU DẤU

Quét toàn bộ UI text. Từ test results thấy:
- Confidence widget: "So khoi" → "Sơ khởi"
- Nav labels trong test report: "San xuat" → "Sản xuất", "Thu vien" → "Thư viện"
- Quét tất cả string literal trong components: mọi text tiếng Việt phải có đầy đủ dấu

---

## 5. BỔ SUNG THÊM (ClaudeKit tự phát hiện khi quét)

Trong quá trình quét codebase cho plan, nếu phát hiện thêm:
- Component nào UI xấu, không đồng nhất style → ghi vào plan
- Responsive issues (mobile bị vỡ layout) → ghi vào plan
- Empty states thiếu hướng dẫn user → ghi vào plan
- Loading states chưa đẹp → ghi vào plan
- Bất kỳ vấn đề UX nào → ghi vào plan

---

## OUTPUT

File: `docs/PLAN-UI-OVERHAUL.md` với cấu trúc:

1. **Tổng quan thay đổi** — bullet list ngắn
2. **Design Tokens** — bảng đầy đủ: colors (hex), typography (font, sizes), spacing, border-radius, shadows
3. **Danh sách file cần sửa** — mỗi file ghi rõ thay đổi gì
4. **Thứ tự thực hiện** — phase nào trước, phase nào sau
5. **Estimate effort** — mỗi phase mất bao lâu
6. **Risks** — gì có thể break

KHÔNG CODE. CHỈ VIẾT PLAN.
