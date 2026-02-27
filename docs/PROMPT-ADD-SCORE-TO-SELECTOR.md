# Thêm thông tin đánh giá vào danh sách chọn SP (tab "Tạo mới")

## Hiện tại

Mỗi item trong list hiện: ảnh + tên + category + giá. Thiếu thông tin để user tự tin chọn.

## Cần thêm

Mỗi item hiện thêm: **combinedScore** (điểm tiềm năng) + **soldCount** (đã bán) + **rating** (đánh giá sao).

Ví dụ mỗi dòng hiện:
- Ảnh 40x40
- Tên SP (truncate)
- Dòng 2: Category · Giá · ⭐ 4.8 · 📦 1.3K đã bán · **🔥 85/100**

Điểm combinedScore hiện dạng badge màu:
- 80-100: xanh lá (tiềm năng cao)
- 60-79: cam (khá)
- dưới 60: xám (thấp)

## Sắp xếp

Danh sách 10 SP sắp xếp theo combinedScore giảm dần (cao nhất trên cùng). Giữ nguyên logic lọc hiện tại.

## Test

1. Mỗi SP trong list hiện đủ: ảnh, tên, category, giá, rating, soldCount, combinedScore
2. SP có combinedScore 85 → badge xanh lá "🔥 85"
3. Danh sách sắp xếp điểm cao nhất trên cùng

Build 0 lỗi.
