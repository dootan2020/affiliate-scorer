3 việc cần làm: (1) Sidebar gom nhóm + 100% tiếng Việt, (2) Thêm TẤT CẢ workflow diagrams vào /guide, (3) Bổ sung Tips chi tiết.

LƯU Ý QUAN TRỌNG: 100% tiếng Việt trong toàn bộ giao diện, nội dung, labels, placeholders. Không để lẫn tiếng Anh. Mục đích: sau này chuyển đa ngôn ngữ (i18n) dễ hơn — chỉ cần thay file ngôn ngữ, không cần rà soát lại từng chỗ.

---

## VIỆC 1: Sidebar gom nhóm + 100% tiếng Việt

### Sidebar hiện tại (lẫn lộn)
```
Dashboard    ← tiếng Anh
Inbox        ← tiếng Anh
Sync         ← tiếng Anh
Sản xuất     ← tiếng Việt
Log          ← tiếng Anh
Thư viện     ← tiếng Việt
Insights     ← tiếng Anh
Hướng dẫn    ← tiếng Việt
Cài đặt      ← tiếng Việt
```

### Sidebar mới (3 nhóm, 100% tiếng Việt)

```
── CÔNG VIỆC HÀNG NGÀY ──
📊 Tổng quan           → /           (icon LayoutDashboard)
📥 Hộp sản phẩm        → /inbox      (icon Inbox)
🔄 Đồng bộ dữ liệu     → /sync       (icon RefreshCw)
🎬 Sản xuất            → /production (icon Clapperboard)
📝 Nhật ký             → /log        (icon FileText)

── PHÂN TÍCH & HỌC ──
📚 Thư viện            → /library    (icon BookOpen)
📈 Phân tích           → /insights   (icon TrendingUp)

── HỖ TRỢ ──
📖 Hướng dẫn           → /guide      (icon HelpCircle)
⚙️ Cài đặt             → /settings   (icon Settings)
```

### Chi tiết kỹ thuật

**Group labels:**
- Kiểu chữ: text-[11px] font-semibold uppercase tracking-wider
- Màu: text-gray-400 dark:text-slate-500
- Padding: px-3 mb-1
- Margin: mt-6 trước nhóm 2 và 3 (tách biệt rõ ràng)

**Mobile bottom nav:**
Giữ 5 item chính (không có group labels):
```
Tổng quan | Hộp SP | Sản xuất | Nhật ký | Thêm ▾
```
"Thêm ▾" mở menu chứa: Đồng bộ, Thư viện, Phân tích, Hướng dẫn, Cài đặt

**Cập nhật tất cả nơi khác cho khớp:**
- Metadata title mỗi page: "Tổng quan | PASTR", "Hộp sản phẩm | PASTR", "Đồng bộ dữ liệu | PASTR", v.v.
- Breadcrumbs (nếu có)
- Mobile header title
- Trang /guide: cập nhật tên trang cho khớp sidebar (ví dụ: "Dashboard" → "Tổng quan", "Inbox" → "Hộp sản phẩm")

**KHÔNG đổi route paths** — chỉ đổi display labels.

---

## VIỆC 2: Thêm TẤT CẢ workflow diagrams vào /guide

### Vấn đề
Trang /guide hiện chỉ có text, không có hình minh họa. Thiếu các luồng công việc chi tiết. Người dùng mới không biết dùng app thế nào.

### Yêu cầu
Thêm section mới "Luồng công việc" ngay sau "2. Quy trình hàng ngày". Chứa TẤT CẢ workflow của app.

### Cách render diagrams

Dùng styled React components (KHÔNG dùng ASCII art, KHÔNG dùng Mermaid):

```tsx
// Tạo component FlowDiagram tái sử dụng
// Props: steps (mảng các bước), direction ('horizontal' | 'vertical')

// Mỗi bước (FlowStep):
// - Card: rounded-xl border-2 p-4 min-w-[180px]
// - Icon + Tiêu đề (font-semibold text-sm)
// - Mô tả ngắn (text-xs text-gray-600 dark:text-slate-400)
// - Danh sách nhỏ bên trong nếu cần

// Mũi tên nối giữa các bước:
// - Desktop: ChevronRight icon hoặc ArrowRight
// - Mobile: ChevronDown (chuyển sang dọc)

// Màu sắc theo loại:
// - Nguồn dữ liệu (input):   border-blue-300 bg-blue-50 dark:bg-blue-950/30
// - Trí tuệ nhân tạo (AI):   border-orange-300 bg-orange-50 dark:bg-orange-950/30
// - Hành động người dùng:     border-gray-300 bg-gray-50 dark:bg-slate-800
// - Kết quả (output):         border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30
// - Cảnh báo / quyết định:    border-amber-300 bg-amber-50 dark:bg-amber-950/30
```

Responsive: desktop = hàng ngang (flex-row), mobile = hàng dọc (flex-col). Container có overflow-x-auto.

### DANH SÁCH TẤT CẢ WORKFLOWS (12 luồng)

---

#### Luồng 1: Sơ đồ tổng quan hệ thống
Mô tả: Toàn cảnh app — dữ liệu đi từ đâu, qua đâu, ra đâu.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  NGUỒN DỮ LIỆU  │     │    PASTR XỬ LÝ   │     │   KẾT QUẢ       │
│                 │     │                 │     │                 │
│ • FastMoss      │────▶│ • Chấm điểm AI  │────▶│ • Video TikTok  │
│ • TikTok Shop   │     │ • Tạo Brief AI  │     │ • Brief sáng tạo│
│ • Dán link      │     │ • Phân tích     │     │ • Báo cáo       │
│ • TikTok Studio │     │ • Học từ phản hồi│     │ • Chiến lược    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

#### Luồng 2: Cài đặt ban đầu (cho người mới)
Mô tả: 4 bước setup lần đầu sử dụng app.

```
Bước 1              Bước 2              Bước 3              Bước 4
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Mở       │──────▶│ Nhập     │──────▶│ Chọn     │──────▶│ Thêm SP  │
│ Cài đặt  │       │ khóa API │       │ mô hình  │       │ đầu tiên │
│          │       │          │       │ AI       │       │          │
│ Chọn nhà │       │ Dán khóa │       │ Đề xuất: │       │ Dán link │
│ cung cấp │       │ Bấm Kiểm │       │ Haiku cho│       │ hoặc     │
│ AI       │       │ tra      │       │ chấm điểm│       │ upload   │
│          │       │          │       │ Sonnet   │       │ FastMoss │
│          │       │ ✅ Đã kết │       │ cho Brief│       │          │
│          │       │ nối      │       │          │       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [Cài đặt]         [Cài đặt]         [Cài đặt]         [Tổng quan]
```

---

#### Luồng 3: Thêm sản phẩm bằng dán link
Mô tả: Cách nhanh nhất để thêm 1 sản phẩm.

```
Bước 1              Bước 2              Bước 3              Bước 4
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Sao chép │──────▶│ Dán link │──────▶│ AI tự    │──────▶│ Xem      │
│ link     │       │ vào ô    │       │ động     │       │ trong    │
│          │       │          │       │          │       │ Hộp SP   │
│ Từ:      │       │ Tổng quan│       │ Trích    │       │          │
│ • TikTok │       │ "Thêm SP │       │ thông tin│       │ Sản phẩm │
│   Shop   │       │  nhanh"  │       │ sản phẩm │       │ đã có    │
│ • FastMoss│      │          │       │          │       │ điểm số  │
│ • Video  │       │ Hoặc:    │       │ Chấm     │       │ 1-100    │
│   TikTok │       │ Hộp SP   │       │ điểm     │       │          │
│          │       │ → Dán    │       │ AI 1-100 │       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [Bên ngoài]       [Tổng quan]         [Tự động]         [Hộp SP]
```

---

#### Luồng 4: Thêm sản phẩm hàng loạt qua FastMoss
Mô tả: Upload file để thêm nhiều sản phẩm cùng lúc.

```
Bước 1              Bước 2              Bước 3              Bước 4
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Vào      │──────▶│ Kéo thả  │──────▶│ App tự   │──────▶│ Sản phẩm │
│ FastMoss │       │ file     │       │ xử lý    │       │ vào      │
│          │       │          │       │          │       │ Hộp SP   │
│ Tìm danh │       │ Vào trang│       │ Nhận diện│       │          │
│ sách SP  │       │ Đồng bộ  │       │ cột tự   │       │ Chấm     │
│ → Xuất   │       │          │       │ động     │       │ điểm AI  │
│ file     │       │ Thả file │       │          │       │ từng SP  │
│ .xlsx    │       │ .xlsx    │       │ Ghép dữ  │       │          │
│          │       │ .csv     │       │ liệu     │       │ Sắp xếp │
│          │       │ .xls     │       │          │       │ theo điểm│
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [FastMoss]        [Đồng bộ]          [Tự động]         [Hộp SP]
```

---

#### Luồng 5: Upload dữ liệu TikTok Studio
Mô tả: Đồng bộ analytics từ TikTok để AI hiểu audience.

```
Bước 1              Bước 2              Bước 3              Bước 4
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Vào      │──────▶│ Kéo thả  │──────▶│ App nhận │──────▶│ AI hiểu  │
│ TikTok   │       │ nhiều    │       │ diện loại│       │ audience │
│ Studio   │       │ file     │       │ file     │       │          │
│          │       │          │       │          │       │ Tối ưu   │
│ Phân tích│       │ Vào trang│       │ Nội dung │       │ brief    │
│ → Xuất   │       │ Đồng bộ  │       │ Tổng quan│       │ phù hợp │
│ các file │       │          │       │ Người    │       │ hơn      │
│ Excel    │       │ Thả cùng │       │ theo dõi │       │          │
│          │       │ lúc      │       │          │       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [TikTok Studio]   [Đồng bộ]          [Tự động]         [Phân tích]
```

---

#### Luồng 6: Chấm điểm sản phẩm (AI Scoring)
Mô tả: AI đánh giá sản phẩm dựa trên nhiều yếu tố.

```
┌──────────────────────────────────────────────────────┐
│                AI CHẤM ĐIỂM SẢN PHẨM                 │
│                                                      │
│  Dữ liệu đầu vào          Xử lý           Kết quả  │
│  ┌──────────┐         ┌──────────┐    ┌──────────┐  │
│  │ Giá bán  │         │          │    │          │  │
│  │ Hoa hồng │────────▶│   AI     │───▶│ Điểm số  │  │
│  │ Lượt bán │         │ Phân tích│    │  1-100   │  │
│  │ Đánh giá │────────▶│ tổng hợp │───▶│          │  │
│  │ Xu hướng │         │          │    │ > 70: ✅  │  │
│  │ Phù hợp  │         │          │    │ 50-70:⚠️ │  │
│  │ TikTok   │         │          │    │ < 50: ❌  │  │
│  └──────────┘         └──────────┘    └──────────┘  │
│                                                      │
│  💡 Điểm cải thiện khi có thêm phản hồi từ bạn     │
└──────────────────────────────────────────────────────┘
```

---

#### Luồng 7: Tạo Brief nội dung bằng AI
Mô tả: Quy trình từ chọn sản phẩm đến có brief hoàn chỉnh.

```
Bước 1              Bước 2              Bước 3              Bước 4
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Chọn     │──────▶│ Bấm     │──────▶│ AI tạo   │──────▶│ Đọc &    │
│ sản phẩm │       │ "Tạo    │       │ nội dung │       │ chọn     │
│          │       │  Brief" │       │          │       │          │
│ Từ Hộp SP│       │          │       │ 3 câu mở │       │ Chọn câu │
│ (điểm    │       │ Chờ     │       │ đầu (hook)│      │ mở hay   │
│  cao)    │       │ 5-15    │       │          │       │ nhất     │
│          │       │ giây    │       │ Kịch bản │       │          │
│ Hoặc từ  │       │          │       │ chi tiết │       │ Dùng     │
│ Tổng quan│       │          │       │          │       │ kịch bản │
│ "Nên tạo │       │          │       │ Góc quay │       │ để quay  │
│  nội dung"│      │          │       │ Hashtags │       │ video    │
│          │       │          │       │ Kêu gọi  │       │          │
│          │       │          │       │ hành động│       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [Hộp SP]          [Sản xuất]         [Tự động]         [Sản xuất]
```

---

#### Luồng 8: Sản xuất video hoàn chỉnh (ngày)
Mô tả: Quy trình 1 ngày từ đọc brief sáng đến log tối.

```
☀️ SÁNG              🌤️ TRƯA             🌅 CHIỀU             🌙 TỐI
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Đọc      │──────▶│ Tìm SP   │──────▶│ Quay     │──────▶│ Ghi      │
│ Bản tin  │       │ mới      │       │ video    │       │ nhật ký  │
│ sáng     │       │          │       │          │       │          │
│          │       │ Upload   │       │ Theo     │       │ Link     │
│ Tổng quan│       │ FastMoss │       │ brief    │       │ video    │
│ → Biết   │       │ mới nhất │       │ đã tạo   │       │ Trạng    │
│ hôm nay  │       │          │       │          │       │ thái     │
│ làm gì   │       │ Hoặc dán │       │ Chỉnh    │       │ Ghi chú  │
│          │       │ link SP  │       │ sửa      │       │          │
│          │       │ tiềm năng│       │          │       │ → AI     │
│          │       │          │       │ Đăng lên │       │ học từ   │
│          │       │          │       │ TikTok   │       │ dữ liệu │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [Tổng quan]       [Đồng bộ/         [Ngoài app]        [Nhật ký]
                     Hộp SP]
```

---

#### Luồng 9: Ghi nhận nhật ký & phản hồi
Mô tả: Log video → đánh giá kết quả → AI học.

```
Bước 1              Bước 2              Bước 3
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Ghi nhận │──────▶│ Đánh giá │──────▶│ AI cập   │
│ video    │       │ kết quả  │       │ nhật     │
│          │       │          │       │          │
│ Sản phẩm │       │ Bán tốt? │       │ Trọng số │
│ Link TikTok      │ Bao nhiêu│       │ chấm điểm│
│ Trạng thái│      │ đơn?     │       │ thay đổi │
│ Ghi chú  │       │          │       │          │
│          │       │ Bán tệ?  │       │ Brief    │
│ [Nhật ký]│       │ Tại sao? │       │ ngày mai │
│          │       │          │       │ tốt hơn  │
│          │       │ [Phản hồi│       │          │
│          │       │ Phân tích]│      │ [Tự động]│
└──────────┘       └──────────┘       └──────────┘
```

---

#### Luồng 10: Vòng lặp học & tối ưu
Mô tả: Hệ thống Learning — AI học từ phản hồi để cải thiện.

```
                    ┌─────────────────────────────────────┐
                    │      VÒNG LẶP HỌC CỦA AI           │
                    └─────────────────────────────────────┘

    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ Nhật ký  │──────▶│ Phản hồi │──────▶│ Chạy     │
    │ video    │       │          │       │ Học      │
    │          │       │ Đánh giá │       │          │
    │ Tích lũy │       │ từng     │       │ Phân tích│
    │ dữ liệu │       │ video    │       │ → Cần    │
    │ hàng ngày│       │          │       │ 10+ phản │
    │          │       │ Tốt/Tệ  │       │ hồi      │
    └──────────┘       └──────────┘       └──────────┘
                                                │
                    ┌───────────────────────────┘
                    ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ AI cập   │──────▶│ Điểm số  │──────▶│ Brief    │
    │ nhật     │       │ chính    │       │ chất     │
    │ trọng số │       │ xác hơn  │       │ lượng    │
    │          │       │          │       │ cao hơn  │
    │ Pattern  │       │ Gợi ý SP │       │          │
    │ thắng/   │       │ phù hợp  │       │ → Quay   │
    │ thua     │       │ hơn      │       │ lại      │
    │          │       │          │       │ bước 1   │
    └──────────┘       └──────────┘       └──────────┘
```

---

#### Luồng 11: Theo dõi thu chi
Mô tả: Ghi nhận thu nhập và chi phí affiliate.

```
Bước 1              Bước 2              Bước 3
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Ghi thu  │──────▶│ Ghi chi  │──────▶│ Xem      │
│ nhập     │       │ phí      │       │ lợi nhuận│
│          │       │          │       │          │
│ Hoa hồng │       │ Quảng cáo│       │ Tự động  │
│ TikTok   │       │ Facebook │       │ tính:    │
│ Shop     │       │          │       │ Thu - Chi│
│          │       │ Công cụ  │       │          │
│ Thưởng   │       │ AI       │       │ Biểu đồ │
│ campaign │       │          │       │ theo     │
│          │       │ Mẫu sản  │       │ tháng    │
│          │       │ phẩm     │       │          │
└──────────┘       └──────────┘       └──────────┘
  [Phân tích       [Phân tích          [Phân tích
   → Thu chi]       → Thu chi]          → Thu chi]
```

---

#### Luồng 12: Chuẩn bị chiến dịch sale
Mô tả: Quy trình chuẩn bị nội dung trước mùa sale.

```
7 ngày trước        5 ngày trước        3 ngày trước        Ngày sale
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Nghiên   │──────▶│ Tạo      │──────▶│ Đăng     │──────▶│ Theo dõi │
│ cứu      │       │ nội dung │       │ video    │       │ kết quả  │
│          │       │          │       │          │       │          │
│ Xem lịch │       │ Tạo      │       │ Đăng 2-3 │       │ Video    │
│ sự kiện  │       │ brief    │       │ video/   │       │ nào      │
│          │       │ nhiều SP │       │ ngày     │       │ viral?   │
│ Chọn SP  │       │          │       │          │       │          │
│ phù hợp  │       │ Quay     │       │ Để thuật │       │ SP nào   │
│ mùa sale │       │ video    │       │ toán đẩy │       │ bán      │
│          │       │ dự trữ   │       │ kịp sale │       │ chạy?    │
│          │       │          │       │          │       │          │
│          │       │          │       │          │       │ Ghi phản │
│          │       │          │       │          │       │ hồi      │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
  [Phân tích       [Sản xuất]          [Ngoài app]       [Nhật ký +
   → Lịch SK]                                             Phân tích]
```

---

### Cập nhật Mục lục (TOC) trong /guide

Thay thế mục lục cũ bằng:
```
1. Bắt đầu nhanh
2. Quy trình hàng ngày
3. Luồng công việc ← MỚI
   3.1 Sơ đồ tổng quan
   3.2 Cài đặt ban đầu
   3.3 Thêm sản phẩm bằng link
   3.4 Thêm sản phẩm hàng loạt
   3.5 Đồng bộ TikTok Studio
   3.6 Chấm điểm sản phẩm
   3.7 Tạo Brief nội dung
   3.8 Quy trình sản xuất ngày
   3.9 Nhật ký & phản hồi
   3.10 Vòng lặp học AI
   3.11 Theo dõi thu chi
   3.12 Chuẩn bị chiến dịch sale
4. Tổng quan (trang chính)
5. Hộp sản phẩm
6. Đồng bộ dữ liệu
7. Sản xuất
8. Nhật ký
9. Phân tích
10. Cấu hình AI khuyến nghị
11. Câu hỏi thường gặp
12. Mẹo sử dụng
```

Lưu ý: tên các trang trong nội dung guide cũng phải cập nhật cho khớp sidebar mới (Dashboard → Tổng quan, Inbox → Hộp sản phẩm, Sync → Đồng bộ, Log → Nhật ký, Insights → Phân tích, FAQ → Câu hỏi thường gặp, Tips → Mẹo sử dụng).

---

## VIỆC 3: Bổ sung Mẹo sử dụng chi tiết

### Thay thế "11. Tips & Tricks" bằng "12. Mẹo sử dụng" chi tiết hơn, chia 5 nhóm:

---

#### Nhóm 1: Quản lý dữ liệu

**Cập nhật FastMoss đúng thời điểm**

FastMoss cập nhật dữ liệu liên tục. Thời điểm upload tối ưu trong ngày làm việc:

- ☀️ **8:00 - 9:00 sáng** — Dữ liệu đêm qua đã ổn định. Thấy rõ sản phẩm nào trending hôm trước. Đây là thời điểm tốt nhất, kết hợp đọc Bản tin sáng.
- 🌤️ **13:00 - 14:00 chiều** — Dữ liệu buổi sáng đã cập nhật. Có thể phát hiện sản phẩm mới đang lên trong ngày. Phù hợp nếu bạn muốn tìm thêm sản phẩm.
- 🌙 **Không nên upload sau 20:00** — Dữ liệu chưa ổn định, điểm số có thể nhảy lung tung, gây nhiễu.

Tần suất khuyến nghị: Ít nhất 1 lần/ngày vào sáng. Nếu rảnh, thêm 1 lần chiều.

**Giữ Hộp sản phẩm gọn gàng**
- Sản phẩm điểm < 40 sau 7 ngày → nên xóa hoặc lưu trữ
- Không để quá 200 sản phẩm — AI phân tích chậm hơn khi danh sách quá lớn
- Dọn dẹp mỗi tuần: xóa sản phẩm hết xu hướng, giữ sản phẩm bền vững (phong thủy, sức khỏe, gia dụng)

**Sao lưu dữ liệu quan trọng**
- Brief hay → lưu vào Thư viện, đánh dấu yêu thích
- Phản hồi chi tiết → ghi rõ ràng, đây là "nhiên liệu" cho AI học

---

#### Nhóm 2: Chọn sản phẩm thông minh

**Hiểu ý nghĩa điểm số**
- **80-100**: Sản phẩm đang hot, nhiều người bán nhưng vẫn có traffic lớn. Cạnh tranh cao — cần câu mở đầu (hook) thật sáng tạo để nổi bật.
- **70-79**: Vùng lý tưởng. Đủ nhu cầu, chưa quá đông người bán. Nên ưu tiên nhóm này.
- **50-69**: Tiềm năng nhưng rủi ro. Chỉ nên quay nếu bạn có góc nhìn độc đáo hoặc audience phù hợp.
- **Dưới 50**: Thường không đáng đầu tư thời gian. Trừ khi bạn phục vụ nhóm khách hàng đặc biệt (niche).

**Đánh giá shop trước khi quay**
Sản phẩm tốt nhưng shop tệ = tiền mất tật mang. Kiểm tra:
- Đánh giá shop < 4.5 ⭐ → tỷ lệ hoàn hàng cao, hoa hồng bị trừ
- Shop mới < 3 tháng → rủi ro đóng shop bất ngờ
- Ít đánh giá (< 100) → chưa đủ tin cậy
- Kiểm tra thêm: thời gian giao hàng, chính sách đổi trả

**Tận dụng mùa khuyến mãi**
Lịch khuyến mãi lớn TikTok Shop trong năm:
- **1/1, 2/2, 3/3, 4/4, 5/5** → Khuyến mãi đầu tháng (quy mô nhỏ)
- **8/3, 20/10** → Quà tặng phụ nữ (mỹ phẩm, phụ kiện bán rất chạy)
- **6/6, 7/7, 8/8, 9/9** → Khuyến mãi giữa năm (quy mô lớn)
- **11/11, 12/12** → Khuyến mãi lớn nhất năm
- **Thứ Sáu Đen** → Cuối tháng 11

Thời gian chuẩn bị: Bắt đầu **7 ngày trước** sale. Đăng video **3-5 ngày trước** để thuật toán TikTok đẩy kịp thời điểm sale.

---

#### Nhóm 3: Tạo brief hiệu quả

**Chọn mô hình AI phù hợp từng tình huống**
- Sản phẩm đơn giản (gia dụng, đồ rẻ dưới 100k): Haiku đủ tốt, nhanh, rẻ
- Sản phẩm cần kể chuyện (mỹ phẩm, thời trang, sức khỏe): Sonnet trở lên
- Sản phẩm khó bán hoặc cần góc nhìn sáng tạo: Dùng Opus cho brief đầu tiên, rồi lấy brief đó làm tham khảo

**Tạo nhiều brief, kết hợp cái hay nhất**
Cùng 1 sản phẩm, mỗi lần tạo brief AI sẽ cho kết quả khác nhau. Chiến lược:
- Tạo 2-3 brief cho cùng 1 sản phẩm
- Chọn câu mở đầu hay nhất từ brief 1
- Kết hợp kịch bản từ brief 2
- Lấy hashtags từ brief 3
- Ghép thành 1 brief hoàn hảo

**Các dạng câu mở đầu hiệu quả trên TikTok Việt Nam**
Thứ tự từ hiệu quả cao → thấp:
1. **Câu hỏi**: "Bạn có biết...?", "Tại sao...?", "Bao nhiêu người biết...?"
2. **POV (Góc nhìn)**: "POV: Khi bạn...", "POV: Sếp thấy bạn..."
3. **Giá gây bất ngờ**: "49k mà ai cũng hỏi mua ở đâu", "Dưới 100k mà xịn hơn hàng hiệu"
4. **Bằng chứng xã hội**: "Mình mới mua cái này, người quen hỏi han suốt", "3 ngày bán 10.000 đơn"
5. **Gây tranh cãi nhẹ**: "Nhiều người bảo cái này vô dụng nhưng...", "Đừng mua cái này nếu..."

---

#### Nhóm 4: Tối ưu vòng lặp học

**Ghi nhật ký đều đặn — kể cả video thất bại**
- Video 0 lượt xem cũng cần ghi nhận → AI biết combo sản phẩm + hook nào không hiệu quả
- Ghi rõ lý do thất bại: video chất lượng kém? Sản phẩm hết hàng? Sai thời điểm đăng? Hook nhàm chán?
- Phản hồi chi tiết = Học chính xác hơn

**Khi nào chạy Học (Learning)?**
- Tối thiểu: sau khi có **10 phản hồi mới** trở lên
- Tốt nhất: cuối mỗi tuần (Chủ nhật tối hoặc Thứ Hai sáng)
- Sau mỗi đợt khuyến mãi lớn (nhiều dữ liệu mới)
- Không cần chạy hàng ngày — tuần 1 lần là đủ

**Đọc Sổ tay chiến lược (Playbook) định kỳ**
Mỗi 2 tuần, vào Phân tích → Sổ tay chiến lược và tự hỏi:
- Loại sản phẩm nào lặp lại trong top? (ví dụ: phong thủy luôn bán tốt?)
- Thời điểm nào video hay được đẩy? (ví dụ: 18-20h tối?)
- Dạng hook nào hay thất bại? → Ghi nhớ và tránh
- Mức giá nào chuyển đổi tốt nhất? (ví dụ: 50k-150k?)

---

#### Nhóm 5: Tiết kiệm chi phí AI

**Nguyên tắc 80/20**
80% chi phí AI nằm ở tác vụ "Tạo Brief" vì nội dung prompt dài nhất. Cách tiết kiệm hiệu quả:
- Chấm điểm sản phẩm: luôn dùng Haiku (nhanh, rẻ, đủ chính xác cho việc chấm điểm)
- Bản tin sáng: Haiku (chỉ tóm tắt dữ liệu, không cần sáng tạo)
- Tạo Brief: Sonnet (điểm cân bằng — hay hơn Haiku 60%, rẻ hơn Opus 80%)
- Chỉ dùng Opus khi: sản phẩm quan trọng, cần brief đặc biệt hay, hoặc thử nghiệm

**Ước tính chi phí thực tế (preset Cân bằng)**
Giả sử mỗi ngày: chấm 10 sản phẩm, tạo 3 brief, 1 bản tin sáng:
- 10 SP × Haiku chấm điểm = khoảng 0,24đ/ngày ($0.01)
- 3 brief × Sonnet = khoảng 7,5đ/ngày ($0.03)
- 1 bản tin sáng × Haiku = khoảng 0,72đ/ngày ($0.003)
- **Tổng: khoảng 32.000đ/tháng (~$1,3)** — rẻ hơn 1 ly cà phê sữa đá

---

### Format hiển thị cho phần Mẹo
- Mỗi nhóm là 1 card (rounded-xl border p-5 mb-4)
- Icon + tiêu đề nhóm: text-base font-semibold (📦 Quản lý dữ liệu, 🎯 Chọn SP, ✍️ Tạo brief, 🔄 Vòng lặp học, 💰 Tiết kiệm chi phí)
- Các mẹo bên trong: text-sm, margin trái
- Callout boxes: nền cam nhạt cho khuyến nghị, nền xanh lá nhạt cho best practice, nền vàng nhạt cho cảnh báo

---

## RÀ SOÁT TIẾNG VIỆT TOÀN BỘ

Sau khi hoàn thành 3 việc trên, chạy rà soát:

1. Tìm tất cả text tiếng Anh còn sót trong giao diện (grep cho các từ phổ biến: Dashboard, Inbox, Sync, Log, Insights, Tips, Tricks, FAQ, Score, Brief, Learning, Playbook, Settings, Guide)
2. Mỗi từ tiếng Anh → thay bằng tiếng Việt tương ứng:
   - Dashboard → Tổng quan
   - Inbox → Hộp sản phẩm
   - Sync → Đồng bộ
   - Log → Nhật ký
   - Insights → Phân tích
   - Tips & Tricks → Mẹo sử dụng
   - FAQ → Câu hỏi thường gặp
   - Score → Điểm số
   - Brief → Brief (giữ vì là thuật ngữ chuyên ngành, hoặc đổi thành "Bản tóm tắt nội dung" nếu muốn full Việt)
   - Learning → Học
   - Playbook → Sổ tay chiến lược
   - Settings → Cài đặt
   - Guide → Hướng dẫn
   - Feedback → Phản hồi
3. Không đổi: tên công nghệ (AI, API, TikTok, FastMoss), route paths (/inbox, /sync), tên model (Haiku, Sonnet, Opus)

---

## YÊU CẦU CHUNG

- Build 0 lỗi
- Kiểm tra responsive: mobile, tablet, desktop
- Sidebar nhóm hiển thị đúng cả desktop lẫn mobile
- Tất cả flow diagrams responsive (ngang trên desktop, dọc trên mobile)
- TOC trong /guide cập nhật đầy đủ 12 mục mới
- Dark mode hoạt động đúng cho tất cả flow diagrams
- Commit: "feat: sidebar nhóm Việt hóa + 12 workflow diagrams + mẹo chi tiết"
