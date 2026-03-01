# Execute: Fix State Machine Issues — 8 Phases

## Tham khảo bắt buộc
- Đọc `docs/state-machines.md` — state machines hiện tại
- Đọc `STANDARDS.md` — coding standards
- Đọc plans chi tiết: `plans/260301-fix-state-machines/` (plan.md + 8 phase files)

## Điều chỉnh so với plan gốc

Thực hiện ĐÚNG theo plan files, **ngoại trừ** các điều chỉnh sau:

### 1. Phase 6 #8a — BỎ DataImport retry
Không implement `failed → pending` cho DataImport. Lý do: file gốc không được lưu, retry không có data để process lại. Chỉ implement #8b (InboxItem retry).

### 2. Phase 4 — Comment rõ empty string convention
Mọi chỗ dùng `channelId: ""` cho global weight phải có comment:
```typescript
// "" = global weight (all channels), "clxxxx" = channel-specific
```

### 3. Phase 3 — Note trong code về scale
Thêm comment tại for loop tạo assets trong transaction:
```typescript
// NOTE: 3 assets/brief hiện tại. Nếu tăng → chuyển sang createMany batch insert
```

### 4. Phase 5 — Note manual override cho v2
Thêm comment tại sync function:
```typescript
// TODO v2: Thêm manualOverride flag để user skip slot không bị sync ghi đè
```

## Thứ tự thực hiện

```
Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7
Phase 4 (chạy sau Phase 1, trước hoặc song song Phase 2/3 đều được)
Phase 8 (cuối cùng)
```

## Yêu cầu chung

- Commit sau MỖI phase hoàn thành (không gộp)
- Chạy compile check (`npx tsc --noEmit`) sau mỗi phase
- Chạy `npx prisma migrate dev` cho Phase 4 (schema change)
- Không tạo file test riêng — focus vào logic
- Nếu gặp code thực tế khác với plan (file path sai, function name khác) → adapt theo code thực tế, không theo plan cứng
