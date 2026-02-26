Bug fix: Setup banner "Chưa có API key" vẫn hiện dù đã kết nối Anthropic thành công.

---

## VẤN ĐỀ

Screenshot cho thấy:
- Trang Settings: Anthropic đã "Đã kết nối" (tick xanh, key ••••ZgAA)  
- Nhưng banner vàng "Chưa có API key" vẫn hiện ở đầu trang

## NGUYÊN NHÂN CÓ THỂ

1. `setup-banner.tsx` gọi API check providers nhưng nhận kết quả sai/chậm
2. API route `/api/ai/providers` trả về data không đúng (isConnected = false dù đã save)
3. Banner không ẩn khi đang ở trang `/settings` (spec ban đầu yêu cầu ẩn ở settings)
4. Logic check `hasConnectedProvider` bị sai

## YÊU CẦU FIX

### 1. Debug flow
- Kiểm tra `setup-banner.tsx`: component fetch data từ đâu? endpoint nào?
- Kiểm tra API route trả về providers: có provider nào `isConnected: true` không?
- Kiểm tra logic: `const hasConnected = providers.some(p => p.isConnected)` — đúng chưa?

### 2. Fix banner logic
- Banner phải ẩn khi: ít nhất 1 provider có `isConnected: true` trong DB
- Banner phải ẩn khi: user đang ở trang `/settings` (usePathname check)
- Banner phải hiện loading state trong khi fetch (không flash "Chưa có" rồi biến mất)

### 3. Fix API route (nếu cần)
- Endpoint trả về providers phải query DB table `ApiProvider` 
- Check field `isConnected` hoặc tương đương
- Trả về `[{ provider: "anthropic", isConnected: true, ... }]`

### 4. Test
- Có API key connected → banner ẨN
- Không có API key → banner HIỆN (trừ trang /settings)
- Xóa API key → banner HIỆN lại
- Trang /settings → banner luôn ẨN (vì user đang ở đúng trang setup rồi)

Build 0 errors. Commit: "fix: setup banner not hiding when API key connected"
