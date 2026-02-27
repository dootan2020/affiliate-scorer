# Loại bỏ toàn bộ hardcoded AI config

## Vấn đề

Trước đây AI model/provider được viết cứng trong code (ví dụ: `"claude-haiku-4-5"`, `"anthropic"`, API key từ env). Hiện đã có trang Settings cho phép user cấu hình AI provider, model, API key cho từng task.

Nhưng nhiều chỗ trong codebase vẫn đang dùng hardcoded. Cần quét toàn bộ và chuyển sang đọc từ Settings DB.

## Yêu cầu

1. Quét toàn bộ codebase, tìm tất cả chỗ đang hardcode: model name, provider name, API key từ env var cho AI calls
2. Chuyển tất cả sang đọc từ cấu hình Settings trong DB (bảng AITaskConfig hoặc tương đương)
3. Nếu user chưa cấu hình Settings → hiện thông báo yêu cầu cấu hình, KHÔNG fallback về hardcoded
4. Tuyệt đối không còn bất kỳ hardcoded AI model/provider nào trong code sau khi fix

## Test

1. Tìm kiếm toàn bộ repo: không còn string hardcoded model name (claude-haiku, gpt-4o, gemini-flash, v.v.)
2. Xóa hết API key trong env → app vẫn chạy nếu đã cấu hình trong Settings, báo lỗi rõ ràng nếu chưa
3. Đổi model trong Settings → lần gọi AI tiếp theo dùng đúng model mới

Build 0 lỗi.
