Chạy test toàn bộ luồng workflow của PASTR trên production (https://affiliate-scorer.vercel.app/) và đưa ra báo cáo kết quả thật.

---

## YÊU CẦU

1. Test TẤT CẢ các trang và luồng workflow
2. Kết quả phải là DỮ LIỆU THẬT — không giả định, không bỏ qua
3. Ghi nhận chính xác: PASS / FAIL / WARN cho từng test case
4. Screenshot hoặc log response cho mỗi test FAIL
5. Cuối cùng tạo file báo cáo `docs/TEST-REPORT.md`

---

## DANH SÁCH TEST CASES

### Nhóm 1: Giao diện chung (UI/Layout)

```
TEST-UI-01: Sidebar desktop hiển thị 3 nhóm (Công việc hàng ngày / Phân tích & Học / Hỗ trợ)
TEST-UI-02: Sidebar labels 100% tiếng Việt (không còn Dashboard, Inbox, Sync, Log, Insights)
TEST-UI-03: Sidebar active state: border trái cam + nền cam nhạt + chữ cam
TEST-UI-04: Sidebar mobile bottom nav hiển thị 5 tab chính
TEST-UI-05: Dark mode toggle hoạt động, tất cả trang chuyển đúng
TEST-UI-06: Responsive: mở mỗi trang ở viewport 375px (mobile) — không bị tràn, không bị ẩn nội dung
TEST-UI-07: Logo PASTR hiển thị đúng (chữ P cam trong hình tròn)
TEST-UI-08: Favicon hiển thị đúng trên tab trình duyệt
TEST-UI-09: Metadata title mỗi trang đúng format "[Tên trang] | PASTR"
```

### Nhóm 2: Trang Cài đặt (/settings)

```
TEST-SET-01: Trang load không lỗi
TEST-SET-02: Dropdown chọn nhà cung cấp AI hiển thị 3 options (Anthropic, OpenAI, Google)
TEST-SET-03: Khi chọn Anthropic → hiện ô nhập key + nút "Kiểm tra kết nối"
TEST-SET-04: Nếu đã có key → hiện trạng thái "Đã kết nối" + key đã che (••••XXXX) + nút xóa
TEST-SET-05: Phần "Mô hình AI theo tác vụ" hiển thị 4 tác vụ (Chấm điểm, Tạo Brief, Bản tin sáng, Báo cáo tuần)
TEST-SET-06: Dropdown model chỉ hiện models từ providers đã kết nối
TEST-SET-07: Thay đổi model → lưu thành công (refresh trang vẫn giữ)
TEST-SET-08: Banner "Chưa có API key" KHÔNG hiện khi đã có provider kết nối
TEST-SET-09: Banner "Chưa có API key" KHÔNG hiện trên trang /settings (dù chưa có key)
```

### Nhóm 3: Trang Tổng quan — Dashboard (/)

```
TEST-DASH-01: Trang load không lỗi, không console error
TEST-DASH-02: Bản tin sáng (Morning Brief) hiển thị nội dung (không trống, không lỗi)
TEST-DASH-03: Nút refresh 🔄 Bản tin sáng hoạt động (gọi API, hiện loading, trả kết quả)
TEST-DASH-04: Widget "Thêm sản phẩm nhanh" hiện ô nhập link
TEST-DASH-05: Dán 1 link TikTok Shop vào ô → bấm thêm → phản hồi (thành công hoặc lỗi rõ ràng)
TEST-DASH-06: Widget "Nên tạo nội dung" hiển thị danh sách SP (nếu có data) hoặc trạng thái trống
TEST-DASH-07: Widget "Hộp sản phẩm" (Inbox Pipeline) hiển thị số liệu
TEST-DASH-08: Widget "Sắp tới" hiển thị sự kiện (nếu có) hoặc trạng thái trống
TEST-DASH-09: Tất cả card headers có divider (border-b) và đúng hierarchy (title text-base font-semibold)
TEST-DASH-10: Các link/nút trong dashboard navigate đúng trang
```

### Nhóm 4: Trang Hộp sản phẩm — Inbox (/inbox)

```
TEST-INB-01: Trang load không lỗi
TEST-INB-02: Danh sách sản phẩm hiển thị (nếu có data)
TEST-INB-03: Mỗi SP hiện: tên, ảnh, điểm số (score), giá, nguồn
TEST-INB-04: Ô dán link hoạt động — dán link → bấm thêm → SP mới xuất hiện
TEST-INB-05: Bộ lọc/sắp xếp hoạt động (theo điểm, theo ngày, theo danh mục)
TEST-INB-06: Click vào 1 SP → mở chi tiết sản phẩm
TEST-INB-07: Nút "Tạo Brief" từ SP → navigate đến trang Sản xuất
TEST-INB-08: Xóa SP hoạt động (nếu có nút xóa)
TEST-INB-09: Trạng thái trống (empty state) hiển thị đúng khi không có SP
TEST-INB-10: Phân trang hoạt động (nếu > 1 trang)
```

### Nhóm 5: Trang Đồng bộ — Sync (/sync)

```
TEST-SYN-01: Trang load không lỗi
TEST-SYN-02: Khu vực kéo thả file hiển thị đúng
TEST-SYN-03: 3 card đồng bộ hiển thị (FastMoss, TikTok Studio, khác)
TEST-SYN-04: Upload 1 file .xlsx nhỏ → xử lý (thành công hoặc lỗi rõ ràng)
TEST-SYN-05: Hiển thị lịch sử đồng bộ (nếu có)
TEST-SYN-06: Trạng thái trống hiển thị đúng khi chưa upload gì
```

### Nhóm 6: Trang Sản xuất (/production)

```
TEST-PRD-01: Trang load không lỗi
TEST-PRD-02: Danh sách SP sẵn sàng tạo brief hiển thị (nếu có SP trong Inbox)
TEST-PRD-03: Chọn 1 SP → bấm "Tạo Brief AI" → gọi API → hiện loading → trả kết quả brief
TEST-PRD-04: Brief hiển thị: hooks, script, hashtags, CTA
TEST-PRD-05: Nút lưu brief vào Thư viện hoạt động
TEST-PRD-06: Trạng thái trống khi chưa có SP
TEST-PRD-07: Xử lý lỗi khi API fail (hiện thông báo lỗi, không crash)
```

### Nhóm 7: Trang Nhật ký — Log (/log)

```
TEST-LOG-01: Trang load không lỗi
TEST-LOG-02: Form tạo nhật ký mới hiển thị các trường: SP, link video, trạng thái, ghi chú
TEST-LOG-03: Tạo 1 entry mới → lưu thành công → hiện trong danh sách
TEST-LOG-04: Sửa entry → lưu thành công
TEST-LOG-05: Xóa entry → xác nhận → xóa thành công
TEST-LOG-06: Bộ lọc theo trạng thái hoạt động
TEST-LOG-07: Trạng thái trống hiển thị đúng
```

### Nhóm 8: Trang Thư viện (/library)

```
TEST-LIB-01: Trang load không lỗi
TEST-LIB-02: Danh sách briefs đã lưu hiển thị (nếu có)
TEST-LIB-03: Click vào brief → xem chi tiết
TEST-LIB-04: Trạng thái trống hiển thị đúng
```

### Nhóm 9: Trang Phân tích — Insights (/insights)

```
TEST-INS-01: Trang load không lỗi
TEST-INS-02: Tab "Tổng quan" hiển thị số liệu chính
TEST-INS-03: Tab "Thu chi" load và hiển thị form/bảng
TEST-INS-04: Tab "Lịch sự kiện" hiển thị calendar hoặc danh sách
TEST-INS-05: Tab "Phản hồi" hiển thị form đánh giá
TEST-INS-06: Tab "Học" (Learning) hiển thị nút "Chạy Học" + trạng thái
TEST-INS-07: Tab "Sổ tay" (Playbook) hiển thị nội dung
TEST-INS-08: Chuyển giữa các tab mượt mà, không flash trắng
TEST-INS-09: Thêm 1 sự kiện mới vào Lịch sự kiện → lưu thành công
TEST-INS-10: Thêm 1 giao dịch thu/chi → lưu thành công
```

### Nhóm 10: Trang Hướng dẫn (/guide)

```
TEST-GDE-01: Trang load không lỗi
TEST-GDE-02: TOC (mục lục) bên trái hiển thị đủ 12 mục chính + sub-items luồng công việc
TEST-GDE-03: Click mục lục → smooth scroll đến section đúng
TEST-GDE-04: TOC highlight mục đang đọc khi scroll (Intersection Observer)
TEST-GDE-05: 12 workflow diagrams hiển thị (kiểm tra có FlowDiagram components, có màu sắc)
TEST-GDE-06: Diagrams responsive — mobile chuyển sang dạng dọc
TEST-GDE-07: Bảng "Cấu hình AI khuyến nghị" hiển thị 3 preset
TEST-GDE-08: Bảng "So sánh model" hiển thị 7 models
TEST-GDE-09: Phần "Câu hỏi thường gặp" có đủ 6 câu hỏi
TEST-GDE-10: Phần "Mẹo sử dụng" có 5 nhóm card chi tiết
TEST-GDE-11: Tất cả text 100% tiếng Việt (không còn "FAQ", "Tips & Tricks", "Score", "Morning Brief", "Dashboard", "Inbox")
TEST-GDE-12: Links trong guide (ví dụ: "Cài đặt") navigate đúng
TEST-GDE-13: Mobile: TOC chuyển thành dropdown
```

### Nhóm 11: Luồng workflow end-to-end (E2E)

```
TEST-E2E-01: Luồng setup → Mở app lần đầu → banner hiện → vào Cài đặt → có thể nhập key
TEST-E2E-02: Luồng paste link → Tổng quan paste link → SP xuất hiện trong Hộp SP → có điểm
TEST-E2E-03: Luồng tạo brief → Hộp SP chọn SP → Sản xuất → Tạo Brief → brief hiển thị
TEST-E2E-04: Luồng log → Nhật ký → tạo entry → entry hiển thị trong danh sách
TEST-E2E-05: Luồng phản hồi → Phân tích → Phản hồi → thêm đánh giá → lưu thành công
TEST-E2E-06: Luồng thu chi → Phân tích → Thu chi → thêm giao dịch → hiện trong bảng
TEST-E2E-07: Luồng sự kiện → Phân tích → Lịch sự kiện → thêm sự kiện → hiện trong calendar
```

### Nhóm 12: Hiệu suất & Lỗi

```
TEST-PERF-01: Mỗi trang load < 3 giây (đo bằng performance.now() hoặc tương đương)
TEST-PERF-02: Không có console.error trên bất kỳ trang nào (trừ network errors do data trống)
TEST-PERF-03: Không có unhandled promise rejection
TEST-PERF-04: Không có hydration mismatch warning
TEST-PERF-05: API routes trả response < 2 giây
```

---

## CÁCH CHẠY TEST

Với mỗi test case:
1. Truy cập URL tương ứng trên production
2. Thực hiện hành động mô tả
3. Ghi nhận kết quả: PASS / FAIL / WARN / SKIP
4. Nếu FAIL: ghi rõ lý do + response/error
5. Nếu WARN: ghi rõ vấn đề (không critical nhưng cần cải thiện)
6. Nếu SKIP: ghi rõ tại sao không test được (ví dụ: cần auth, cần data cụ thể)

Dùng các lệnh:
- `curl` để test API endpoints
- `curl -s -o /dev/null -w "%{http_code}" <url>` để test HTTP status
- `curl -s <url> | grep "text cần tìm"` để verify nội dung
- Truy cập trực tiếp các trang và kiểm tra HTML response

---

## FORMAT BÁO CÁO

Tạo file `docs/TEST-REPORT.md` với format:

```markdown
# 📊 BÁO CÁO KIỂM THỬ PASTR

**Ngày chạy:** [ngày]
**Môi trường:** Production (https://affiliate-scorer.vercel.app)
**Phiên bản:** Commit [hash]
**Người chạy:** ClaudeKit (tự động)

---

## Tổng kết

| Chỉ số | Giá trị |
|--------|---------|
| Tổng test cases | XX |
| ✅ PASS | XX |
| ❌ FAIL | XX |
| ⚠️ WARN | XX |
| ⏭️ SKIP | XX |
| Tỷ lệ pass | XX% |

---

## Kết quả chi tiết

### Nhóm 1: Giao diện chung

| ID | Mô tả | Kết quả | Ghi chú |
|----|-------|---------|---------|
| TEST-UI-01 | Sidebar 3 nhóm | ✅ PASS | |
| TEST-UI-02 | Labels tiếng Việt | ❌ FAIL | Còn "Dashboard" ở mobile nav |
| ... | ... | ... | ... |

### Nhóm 2: Cài đặt
[bảng tương tự]

... [tất cả 12 nhóm]

---

## Danh sách lỗi cần sửa (FAIL)

### FAIL-01: [Tên lỗi]
- **Test ID:** TEST-XX-XX
- **Mô tả:** [chi tiết]
- **Bước tái hiện:** [steps]
- **Kết quả thực tế:** [gì xảy ra]
- **Kết quả mong đợi:** [gì đáng lẽ phải xảy ra]
- **Mức độ:** Critical / High / Medium / Low

### FAIL-02: [Tên lỗi]
[tương tự]

---

## Danh sách cảnh báo (WARN)

### WARN-01: [Tên vấn đề]
- **Test ID:** TEST-XX-XX
- **Mô tả:** [chi tiết]
- **Đề xuất:** [cách cải thiện]

---

## Khuyến nghị

1. [Ưu tiên cao] ...
2. [Ưu tiên trung bình] ...
3. [Ưu tiên thấp] ...
```

---

## LƯU Ý

- Test trên production URL thật, KHÔNG test trên localhost
- Kết quả phải phản ánh thực tế — không bịa, không giả định
- Nếu trang cần đăng nhập và không thể test → ghi SKIP + lý do
- Nếu API cần body/auth → ghi rõ response thật nhận được
- Commit file báo cáo: "docs: test report — kết quả kiểm thử toàn bộ workflow"
