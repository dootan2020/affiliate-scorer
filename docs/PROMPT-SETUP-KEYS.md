Làm 3 bước theo thứ tự:

## Bước 1: Tạo ENCRYPTION_KEY

Chạy:
```bash
openssl rand -hex 32
```
In ra kết quả cho tôi copy.

## Bước 2: Hướng dẫn tôi cài Vercel env vars

In rõ hướng dẫn:
1. Vào Vercel → project → Settings → Environment Variables
2. Thêm `ENCRYPTION_KEY` = [giá trị vừa generate] → Production + Preview
3. Xóa `ANTHROPIC_API_KEY` (code không dùng env var nữa, key nhập từ UI)
4. Click Redeploy (Deployments → ... → Redeploy)

## Bước 3: Sau khi tôi redeploy xong

Tôi sẽ cung cấp Anthropic API key test. Hãy:
1. Mở /settings trên Vercel live URL
2. Chọn Anthropic (Claude)
3. Nhập key tôi cung cấp
4. Click "Kiểm tra kết nối"
5. Nếu OK → chọn model cho từng tác vụ → Lưu cấu hình
6. Quay về Dashboard → kiểm tra Morning Brief có load không
7. Screenshot kết quả cho tôi xem

Nếu có lỗi ở bước nào → dừng lại, báo lỗi chi tiết (console log, network response) để fix.
