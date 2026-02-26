Đọc docs/ROADMAP-FINAL-V2.md để hiểu hướng mới (Content Factory).

6 việc + 1 báo cáo:

1. GỘP INBOX + SẢN PHẨM: Trang /products hiện tại đã có UI tốt (table, filter, detail page, ảnh SP, pagination). KHÔNG dùng UI inbox hiện tại (cards bị lỗi ảnh, detail trống). Thay vào đó:
   - Đổi route /products → /inbox (redirect /products → /inbox)
   - Giữ nguyên table view + detail page của /products
   - Thêm ô "Dán links sản phẩm" ở trên cùng trang /inbox (lấy từ inbox cũ)
   - Thêm filter tabs trên table: Tất cả | Mới | Đã bổ sung | Đã chấm | Đã brief | Đã xuất bản (theo inbox_state)
   - Thêm cột Delta (NEW/SURGE/COOL/STABLE) và Content Score vào table
   - Trong detail page: thêm nút "Tạo Brief" link sang /production
   - Giữ quick enrich modal từ inbox cũ
   - Xóa code UI inbox cũ (cards view, inbox page riêng)

2. CẬP NHẬT WORKFLOW SAU GỘP — CỰC KỲ QUAN TRỌNG: Sau khi gộp, MỌI trang reference "Inbox" cũ phải update logic:
   - /production: "Chọn sản phẩm từ Inbox" → query từ product_identities (đã gộp với products), hiện ảnh + tên + giá + score. SP hiện trong list phải là SP đã được chấm điểm (inbox_state = "scored" trở lên).
   - /dashboard Morning Brief: SP gợi ý link đến /inbox/[id] (detail page trong inbox mới)
   - /dashboard Inbox Pipeline: count từ product_identities by inbox_state
   - /dashboard "Nên tạo content": query product_identities sort by combined_score, chỉ hiện SP chưa brief
   - /log: match video link → content_asset → product_identity
   - Tất cả các nơi khác reference inbox_items hoặc products table cũ → đều phải thống nhất dùng product_identities
   Workflow phải đơn giản, nhân viên mới nhìn qua là hiểu được.

3. NAVIGATION: Chuyển từ top menu sang left sidebar, 7 items có icon: 📊 Dashboard, 📥 Inbox, 🔄 Sync, 🎬 Sản xuất, 📝 Log, 📚 Thư viện, 💡 Insights. Sidebar collapse trên mobile.

4. TRANG SYNC: Đổi tên Upload → Sync với 2 phần:
   Phần 1 — "Nghiên cứu sản phẩm": Giữ nguyên upload FastMoss/KaloData XLSX.
   Phần 2 — "TikTok Studio Analytics": 1 dropzone duy nhất, kéo thả nhiều file cùng lúc, app tự detect loại file theo tên file (Content.xlsx, Overview.xlsx, FollowerActivity.xlsx, v.v.). Parse từng loại:
   - Content.xlsx (cột: Time, Video title, Video link, Post time, Total likes, Total comments, Total shares, Total views) → Parse và AUTO-MATCH video link với content_assets → tự động fill metrics vào asset_metrics.
   - Overview.xlsx (cột: Date, Video Views, Profile Views, Likes, Comments, Shares) → Lưu account daily stats.
   - FollowerActivity.xlsx (cột: Date, Hour, Active followers — 168 rows = 24h × 7 ngày) → Lưu để AI gợi ý giờ đăng tốt nhất.
   - Viewers.xlsx, FollowerHistory.xlsx, FollowerGender.xlsx, FollowerTopTerritories.xlsx → Lưu account insights.
   Xóa phần "Kết quả chiến dịch" (FB/TikTok/Shopee Ads) và "Nhập kết quả thủ công".
   Route /upload redirect → /sync.
   Lưu ý: date format từ TikTok Studio là tiếng Việt (VD: "17 tháng Hai") — parser phải handle đúng.

5. DASHBOARD SỬA LẠI:
   - Morning Brief: giữ, SP gợi ý link đến /inbox/[id]
   - Thay "Top Picks Hôm Nay" → "Nên tạo content" (sort by combined_score, CHỈ hiện SP chưa brief, có nút "Tạo Brief →")
   - Morning Brief và bảng "Nên tạo content" phải dùng CÙNG logic ranking — không mâu thuẫn
   - Xóa: "AI chưa có data để học — Upload kết quả quảng cáo", nút "Upload CSV", nút "Export"
   - Giữ: Paste link nhanh, Inbox Pipeline, Sắp tới (lịch sale)

6. TRANG THƯ VIỆN + DỌN RÁC:
   - Tạo /library — hiện tất cả content_assets, filter by status/format/product, sort by ngày/views/reward
   - Gộp Playbook cũ vào Insights
   - Xóa hoàn toàn: Campaigns (code + route + components + API), parsers FB/Shopee Ads, budget tracker, campaign tracker, inbox cards view cũ
   - Quét codebase xóa mọi code không dùng

LƯU Ý BỔ SUNG:
- Kiểm tra env vars đã config chưa bằng `vercel env ls` (KHÔNG đọc value, chỉ check tên biến tồn tại). Nếu thiếu ANTHROPIC_API_KEY → chạy `vercel env add ANTHROPIC_API_KEY production` (lệnh interactive, user tự nhập value, ClaudeKit không thấy key). Tương tự check các env vars khác cần thiết (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, v.v.). Trang /production nếu thiếu key → hiện thông báo rõ ràng thay vì crash. KHÔNG BAO GIỜ đọc file .env hoặc .env.local để lấy key value.
- Nếu file .env chứa key thật (không phải .env.local) → di chuyển sang .env.local, đảm bảo .env.local nằm trong .gitignore, xóa key khỏi .env.
- Trang /log VẪN GIỮ chức năng nhập tay metrics (cho video mới đăng chưa có trong TikTok Studio export). Thêm note trên trang: "Hoặc upload file TikTok Studio ở trang Sync để tự động cập nhật hàng loạt".

7. BÁO CÁO — BẮT BUỘC: Sau khi hoàn thành 6 việc trên, quét toàn bộ hệ thống và viết file docs/WORKFLOW-REPORT.md lưu vào project. Nội dung:
   - Sơ đồ tất cả luồng workflow hiện có (từng bước, data đi từ đâu đến đâu)
   - Mỗi trang: chức năng, data source, output, liên kết với trang khác
   - Database: bảng nào đang dùng, quan hệ giữa các bảng
   - API: endpoints nào đang active
   - Vấn đề phát hiện: flow nào còn đứt, logic nào chưa khớp, UI nào cần sửa
   File này phải phản ánh đúng trạng thái THỰC TẾ của code, không phải trạng thái mong muốn.

Toàn bộ UI tiếng Việt có dấu. Ảnh SP phải hiển thị đúng.
