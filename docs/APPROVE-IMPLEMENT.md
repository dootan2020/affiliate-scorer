APPROVED. Đọc docs/PLAN-UI-OVERHAUL.md + tất cả file design-system trong docs/ và bắt đầu implement. Áp dụng các điều chỉnh bổ sung dưới đây (override plan nếu mâu thuẫn):

---

## BỔ SUNG 1: Typography lớn hơn plan

| Element | Plan cũ | Áp dụng |
|---------|---------|---------|
| H1 (page title) | 24-28px | **32px** (`text-[32px]`) |
| H2 (section title) | 20-22px | **24px** (`text-2xl`) |
| H3 (card title) | 18px | **18px** (giữ) |
| Body | 14-15px | **15px** (`text-[15px]`) |

---

## BỔ SUNG 2: API Key bảo mật

KHÔNG lưu API key plaintext trong DB. Thay vào đó:

- Settings page hiện trạng thái: "✅ Đã kết nối" hoặc "❌ Chưa có API key"
- Kiểm tra bằng cách gọi thử Anthropic API với key từ env var (chỉ check, không lưu key)
- Nếu key tồn tại → hiện 4 ký tự cuối: `••••••••ab3f`
- Nếu chưa có key → hiện hướng dẫn: "Thêm API key qua Vercel CLI: `vercel env add ANTHROPIC_API_KEY production`"
- Model selection VẪN lưu DB (AiModelConfig) — chỉ lưu model ID, KHÔNG lưu key
- Fetch available models: dùng key từ `process.env.ANTHROPIC_API_KEY`, KHÔNG từ user input

---

## BỔ SUNG 3: Font fallback chain

```
"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

---

## BỔ SUNG 4: Sidebar active state cụ thể

Active nav item phải nổi bật rõ ràng:
```
Active:   border-left 3px solid #E87B35 + bg-orange-50 + text-orange-700 + font-medium
Inactive: border-left 3px solid transparent + text-gray-600 + hover:bg-gray-50 + hover:text-gray-900
```
Dark mode:
```
Active:   border-left 3px solid #FF8F47 + bg-orange-950/20 + text-orange-400
Inactive: text-gray-400 + hover:bg-slate-800 + hover:text-gray-200
```

---

## THỨ TỰ THỰC HIỆN

1. Phase 3A: Font (Be Vietnam Pro + fallback chain) → commit
2. Phase 3B: Colors (globals.css tokens + blue→orange 20 files + sidebar active) → commit
3. Phase 3C: Typography (heading sizes + body + table rows) → commit
4. Phase 2: Fix ảnh (2 files → ProductImage) → commit
5. Phase 1: Settings page (migration + API routes + UI + update callClaude callers) → commit
6. Build check + deploy + screenshot all pages

Mỗi phase commit riêng. Sau phase cuối: `pnpm build` phải pass 0 errors.
